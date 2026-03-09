import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { Progress } from '@/components/ui/progress';
import { GoalDTO, apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  name?: string;
  email?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

const DASHBOARD_GRADIENT = ['#000000', '#073D33', '#107A65', '#20F4CA'] as const;

export default function GoalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
  });

  useEffect(() => {
    void initializePage();
  }, []);

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;

    const raw = value.trim();
    if (!raw) return 0;

    const cleaned = raw.replace(/[^\d,.-]/g, '');
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      const normalized =
        lastComma > lastDot
          ? cleaned.replace(/\./g, '').replace(',', '.')
          : cleaned.replace(/,/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (hasComma) {
      const parsed = Number(cleaned.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeGoal = (goal: GoalDTO, index: number): Goal => {
    const normalizedTitle = String(goal?.title ?? goal?.titulo ?? goal?.nome ?? '').trim();
    const normalizedDescription = String(goal?.description ?? goal?.descricao ?? '').trim();

    return {
      id: String(goal?.id ?? goal?._id ?? `meta-${index}`),
      title: normalizedTitle || 'Meta sem titulo',
      description: normalizedDescription || 'Meta financeira',
      targetAmount: toNumber(goal?.targetAmount ?? goal?.valorMeta),
      currentAmount: toNumber(goal?.currentAmount ?? goal?.valorAtual),
      deadline: String(goal?.deadline ?? goal?.prazo ?? ''),
      category: String(goal?.category ?? goal?.categoria ?? 'Geral'),
    };
  };

  const loadGoals = async () => {
    try {
      const rawGoals = await apiService.getMetas();
      const normalizedGoals = (rawGoals ?? []).map(normalizeGoal);
      setGoals(normalizedGoals);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      setGoals([]);
    }
  };

  const parseInputAmount = (value: string): number => {
    const raw = String(value ?? '').trim();
    if (!raw) return 0;
    const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  };

  const normalizeDeadlineInput = (value: string): string => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  const deadlineToApi = (value: string): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    const br = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (br) {
      const [, day, month, year] = br;
      return `${year}-${month}-${day}`;
    }

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return raw;

    return '';
  };

  const deadlineToInput = (value: string): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const [, year, month, day] = iso;
      return `${day}-${month}-${year}`;
    }

    const br = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (br) return raw;

    return '';
  };

  const resetNewGoalForm = () => {
    setNewGoal({
      title: '',
      description: '',
      amount: '',
      deadline: '',
    });
  };

  const openCreateGoalModal = () => {
    setEditingGoalId(null);
    resetNewGoalForm();
    setIsDialogOpen(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoal({
      title: goal.title,
      description: goal.description === 'Meta financeira' ? '' : goal.description,
      amount: String(goal.targetAmount).replace('.', ','),
      deadline: deadlineToInput(goal.deadline || ''),
    });
    setIsDialogOpen(true);
  };

  const handleCreateGoal = async () => {
    const nome = newGoal.title.trim();
    const descricao = newGoal.description.trim();
    const prazo = deadlineToApi(newGoal.deadline.trim());
    const valorMeta = parseInputAmount(newGoal.amount);

    if (!nome) {
      Alert.alert('Campo obrigatorio', 'Informe o titulo da meta.');
      return;
    }

    if (valorMeta <= 0) {
      Alert.alert('Valor invalido', 'Informe um valor de meta maior que zero.');
      return;
    }

    try {
      setIsCreatingGoal(true);
      if (editingGoalId) {
        await apiService.updateMeta(editingGoalId, {
          nome,
          valorMeta,
          descricao: descricao || undefined,
          prazo: prazo || undefined,
        });
      } else {
        await apiService.createMeta({
          nome,
          valorMeta,
          descricao: descricao || undefined,
          prazo: prazo || undefined,
        });
      }
      await loadGoals();
      resetNewGoalForm();
      setEditingGoalId(null);
      setIsDialogOpen(false);
      Alert.alert('Sucesso', editingGoalId ? 'Meta atualizada com sucesso.' : 'Meta criada com sucesso.');
    } catch (error: any) {
      const message = String(error?.message ?? 'Nao foi possivel salvar a meta.');
      Alert.alert('Erro ao salvar meta', message);
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Excluir meta',
      `Deseja excluir a meta \"${goal.title}\"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMeta(goal.id);
              await loadGoals();
              Alert.alert('Sucesso', 'Meta excluida com sucesso.');
            } catch (error: any) {
              const message = String(error?.message ?? 'Nao foi possivel excluir a meta.');
              Alert.alert('Erro ao excluir meta', message);
            }
          },
        },
      ]
    );
  };

  const initializePage = async () => {
    try {
      const [authToken, legacyAuthToken, storedUser, legacyStoredUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('@authToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('@user'),
      ]);
      const token = authToken || legacyAuthToken;
      const userFromStorage = storedUser || legacyStoredUser;

      if (!token) {
        router.replace('/login');
        return;
      }

      if (userFromStorage) {
        setUser(JSON.parse(userFromStorage));
      } else {
        setUser(null);
      }

      await loadGoals();
    } catch (error) {
      console.error('Erro ao inicializar tela de metas:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  const calculateDaysLeft = (deadline: string) => {
    if (!deadline) return 0;
    const today = new Date();
    const targetDate = new Date(deadline);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateBR = (deadline: string) => {
    if (!deadline) return 'Sem prazo';
    const raw = String(deadline).trim();

    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const [, year, month, day] = isoDate;
      return `${day}-${month}-${year}`;
    }

    const brDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brDate) {
      const [, day, month, year] = brDate;
      return `${day}-${month}-${year}`;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return 'Sem prazo';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const visibleGoals = goals.slice(0, 3);
  const goalSlots = Array.from({ length: 3 }, (_, index) => visibleGoals[index] ?? null);
  const cardWidth = isLargeScreen ? '32%' : '100%';

  const renderGoalCard = (goal: Goal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const daysLeft = calculateDaysLeft(goal.deadline);

    return (
      <View key={goal.id} style={[styles.goalCard, { width: cardWidth, flexBasis: cardWidth, flexGrow: 0 }]}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription}>{goal.description}</Text>
        </View>

        <View style={styles.goalContent}>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
            </View>
            <Progress value={progress} style={styles.progressBar} />
          </View>

          <View style={styles.valuesContainer}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Atual</Text>
              <Text style={styles.valueAmount}>R$ {formatCurrency(goal.currentAmount)}</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Meta</Text>
              <Text style={styles.valueAmount}>R$ {formatCurrency(goal.targetAmount)}</Text>
            </View>
          </View>

          <View style={styles.remainingInfo}>
            <Text style={styles.remainingLabel}>Faltam</Text>
            <Text style={styles.remainingAmount}>R$ {formatCurrency(remaining)}</Text>
            <Text style={styles.remainingDays}>Prazo: {formatDateBR(goal.deadline)}</Text>
            <Text style={styles.remainingDays}>{daysLeft} dias restantes</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditGoalModal(goal)}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGoal(goal)}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyGoalCard = (index: number) => {
    return (
      <View key={`empty-goal-${index}`} style={[styles.goalCard, styles.emptyGoalCard, { width: cardWidth, flexBasis: cardWidth, flexGrow: 0 }]}>
        <Text style={styles.emptyGoalIcon}>🎯</Text>
        <Text style={styles.emptyGoalTitle}>Meta vazia</Text>
        <Text style={styles.emptyGoalText}>Cadastre uma meta para preencher este card.</Text>
        {index === 0 && (
          <TouchableOpacity style={styles.emptyGoalButton} onPress={openCreateGoalModal}>
            <Text style={styles.emptyGoalButtonText}>Criar primeira meta</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#000000' />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
      <View style={[styles.layoutContainer, { paddingTop: insets.top }]}> 
        <DashboardHeader />

        <View style={styles.content}>
          {isLargeScreen && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarContent}>
                <DashboardNav />
              </View>
            </View>
          )}

          <View style={styles.main}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pageContent}>
                <View style={styles.header}>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>Metas Financeiras</Text>
                    <Text style={styles.subtitle}>Gerencie suas metas e acompanhe seu progresso</Text>
                  </View>

                  <TouchableOpacity style={styles.newGoalButton} onPress={openCreateGoalModal}>
                    <Text style={styles.newGoalButtonText}>Nova Meta</Text>
                  </TouchableOpacity>
                </View>

                <Modal
                  visible={isDialogOpen}
                  animationType='slide'
                  transparent
                  onRequestClose={() => {
                    setIsDialogOpen(false);
                    setEditingGoalId(null);
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingGoalId ? 'Editar Meta' : 'Criar Nova Meta'}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setIsDialogOpen(false);
                            setEditingGoalId(null);
                          }}
                          style={styles.closeButton}
                        >
                          <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={styles.modalBody}>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Titulo da Meta</Text>
                          <TextInput
                            style={styles.input}
                            placeholder='Ex: Reserva de emergencia'
                            value={newGoal.title}
                            onChangeText={(text) => setNewGoal((prev) => ({ ...prev, title: text }))}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Descricao</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder='Descreva sua meta...'
                            value={newGoal.description}
                            onChangeText={(text) => setNewGoal((prev) => ({ ...prev, description: text }))}
                            multiline
                            numberOfLines={3}
                            textAlignVertical='top'
                          />
                        </View>

                        <View style={styles.formRow}>
                          <View style={[styles.formGroup, styles.flex1]}>
                            <Text style={styles.label}>Valor Alvo (R$)</Text>
                            <TextInput
                              style={styles.input}
                              placeholder='0,00'
                              value={newGoal.amount}
                              onChangeText={(text) => setNewGoal((prev) => ({ ...prev, amount: text }))}
                              keyboardType='numeric'
                            />
                          </View>

                          <View style={[styles.formGroup, styles.flex1]}>
                            <Text style={styles.label}>Prazo (DD-MM-AAAA)</Text>
                            <TextInput
                              style={styles.input}
                              placeholder='DD-MM-AAAA'
                              value={newGoal.deadline}
                              onChangeText={(text) =>
                                setNewGoal((prev) => ({ ...prev, deadline: normalizeDeadlineInput(text) }))
                              }
                              keyboardType='numeric'
                            />
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.createButton, isCreatingGoal && styles.createButtonDisabled]}
                          onPress={handleCreateGoal}
                          disabled={isCreatingGoal}
                        >
                          <Text style={styles.createButtonText}>
                            {isCreatingGoal ? 'Salvando...' : editingGoalId ? 'Salvar Alteracoes' : 'Criar Meta'}
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Suas Metas</Text>
                  <View style={styles.goalsGrid}>
                    {goalSlots.map((goal, index) => (goal ? renderGoalCard(goal) : renderEmptyGoalCard(index)))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  layoutContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 256,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  pageContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
  },
  newGoalButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGoalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  goalsGrid: {
    gap: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    minHeight: 220,
    padding: 18,
  },
  emptyGoalCard: {
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyGoalIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyGoalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyGoalText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyGoalButton: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyGoalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  goalHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalContent: {
    paddingTop: 12,
    gap: 14,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
  },
  valuesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  remainingInfo: {
    gap: 4,
  },
  remainingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  remainingDays: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
    maxHeight: 400,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
