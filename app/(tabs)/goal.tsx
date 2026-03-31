import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { Progress } from '@/components/ui/progress';
import { CreateDespesaDTO, GoalDTO, apiService } from '@/services/api';
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

const DASHBOARD_GRADIENT = ['#F4F7FB', '#EAF1F8', '#E2ECF6', '#DCE7F4'] as const;
const GOALS_CACHE_KEY = 'goalsCache';
const GOAL_TRANSACTION_LINKS_KEY = 'goalTransactionLinks';

interface GoalTransactionLink {
  goalId: string;
  transactionIds: string[];
  amount: number;
  date: string;
  description: string;
  notes?: string;
}

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
    const normalizedTitle = String(
      goal?.title ?? goal?.titulo ?? goal?.nome ?? (goal as any)?.name ?? (goal as any)?.label ?? '',
    ).trim();
    const normalizedDescription = String(
      goal?.description ?? goal?.descricao ?? (goal as any)?.detalhes ?? (goal as any)?.observacao ?? '',
    ).trim();

    return {
      id: String(goal?.id ?? goal?._id ?? `meta-${index}`),
      title: normalizedTitle || 'Meta sem titulo',
      description: normalizedDescription || 'Meta financeira',
      targetAmount: toNumber(
        goal?.targetAmount ??
        goal?.valorMeta ??
        (goal as any)?.valorAlvo ??
        (goal as any)?.meta ??
        (goal as any)?.amount,
      ),
      currentAmount: toNumber(
        goal?.currentAmount ??
        goal?.valorAtual ??
        (goal as any)?.valorGuardado ??
        (goal as any)?.atual ??
        (goal as any)?.savedAmount,
      ),
      deadline: String(
        goal?.deadline ?? goal?.prazo ?? (goal as any)?.dataLimite ?? (goal as any)?.dueDate ?? '',
      ),
      category: String(goal?.category ?? goal?.categoria ?? (goal as any)?.tipo ?? 'Geral'),
    };
  };

  const mergeGoals = (baseGoals: Goal[], incomingGoals: Goal[]) => {
    const goalMap = new Map<string, Goal>();

    const getGoalKey = (goal: Goal) => {
      const normalizedId = String(goal.id ?? '').trim();
      if (normalizedId && !normalizedId.startsWith('meta-')) return `id:${normalizedId}`;

      return `fallback:${goal.title.trim().toLowerCase()}|${goal.targetAmount}|${goal.deadline.trim()}`;
    };

    for (const goal of baseGoals) {
      goalMap.set(getGoalKey(goal), goal);
    }

    for (const goal of incomingGoals) {
      goalMap.set(getGoalKey(goal), goal);
    }

    return Array.from(goalMap.values());
  };

  const persistGoals = async (nextGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(GOALS_CACHE_KEY, JSON.stringify(nextGoals));
    } catch (error) {
      console.error('Erro ao salvar cache de metas:', error);
    }
  };

  const loadGoalTransactionLinks = async () => {
    try {
      const raw = await AsyncStorage.getItem(GOAL_TRANSACTION_LINKS_KEY);
      if (!raw) return {} as Record<string, GoalTransactionLink>;

      const parsed = JSON.parse(raw) as Record<string, GoalTransactionLink>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.error('Erro ao carregar vinculos de metas:', error);
      return {} as Record<string, GoalTransactionLink>;
    }
  };

  const persistGoalTransactionLinks = async (links: Record<string, GoalTransactionLink>) => {
    try {
      await AsyncStorage.setItem(GOAL_TRANSACTION_LINKS_KEY, JSON.stringify(links));
    } catch (error) {
      console.error('Erro ao salvar vinculos de metas:', error);
    }
  };

  const normalizeDateToIso = (value?: string) => {
    const raw = String(value ?? '').trim();
    if (!raw) return new Date().toISOString().split('T')[0];

    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;

    if (isoPattern.test(raw)) return raw;
    if (brSlashPattern.test(raw) || brDashPattern.test(raw)) {
      const match = raw.match(brSlashPattern) ?? raw.match(brDashPattern);
      const [, day, month, year] = match!;
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    return parsed.toISOString().split('T')[0];
  };

  const normalizeComparableDate = (value: string) => normalizeDateToIso(value);

  const normalizeGoalTransactionText = (value: string) => String(value ?? '').trim().toLowerCase();

  const resolveTransactionIds = (item: any) => {
    const candidates: string[] = [];
    const pushCandidate = (value: unknown) => {
      if (value === null || value === undefined) return;
      const normalized = String(value).trim();
      if (!normalized || candidates.includes(normalized)) return;
      candidates.push(normalized);
    };

    const preferredKeys = [
      'id',
      '_id',
      'Id',
      'ID',
      'transactionId',
      'transacaoId',
      'idTransacao',
      'receitaId',
      'despesaId',
      'id_receita',
      'id_despesa',
      'uuid',
    ];

    for (const key of preferredKeys) {
      pushCandidate(item?.[key]);
    }

    for (const [key, value] of Object.entries(item ?? {})) {
      const normalizedKey = key.toLowerCase();
      const isLikelyId = normalizedKey.includes('id');
      const isForeignId = normalizedKey.includes('user') || normalizedKey.includes('usuario');
      if (!isLikelyId || isForeignId) continue;
      pushCandidate(value);
    }

    pushCandidate(item?.despesa?.id);
    pushCandidate(item?.transacao?.id);
    return candidates;
  };

  const buildGoalTransactionPayload = (
    nome: string,
    descricao: string,
    valorMeta: number,
    prazo?: string,
  ): CreateDespesaDTO => ({
    descricao: nome || 'Meta de investimento',
    valor: valorMeta,
    categoria: 'Investimento',
    data: normalizeDateToIso(prazo),
    observacao: descricao || undefined,
    recorrente: false,
    recurring: false,
  });

  const findGoalTransactionIdsByPayload = async (payload: CreateDespesaDTO) => {
    const transactions = await apiService.getTransactions().catch(() => []);
    const matched = (transactions ?? []).find((transaction: any) => {
      const type = String(transaction?.type ?? transaction?.tipo ?? '').toLowerCase().trim();
      const normalizedType = type === 'income' || type === 'receita' || type === 'entrada' ? 'income' : 'expense';

      return (
        normalizedType === 'expense' &&
        Math.abs(Number(transaction?.amount ?? transaction?.valor ?? 0) - payload.valor) < 0.001 &&
        normalizeGoalTransactionText(String(transaction?.description ?? transaction?.descricao ?? '')) ===
          normalizeGoalTransactionText(payload.descricao) &&
        normalizeGoalTransactionText(String(transaction?.category ?? transaction?.categoria ?? '')) ===
          normalizeGoalTransactionText(payload.categoria) &&
        normalizeComparableDate(String(transaction?.date ?? transaction?.data ?? '')) ===
          normalizeComparableDate(payload.data)
      );
    });

    return resolveTransactionIds(matched);
  };

  const syncGoalTransaction = async (
    goalId: string,
    payload: CreateDespesaDTO,
    existingLink?: GoalTransactionLink,
  ): Promise<GoalTransactionLink> => {
    const transactionIds = [...new Set(existingLink?.transactionIds ?? [])].filter(Boolean);

    if (transactionIds.length > 0) {
      let lastError: unknown = null;

      for (const transactionId of transactionIds) {
        try {
          await apiService.updateTransaction(
            transactionId,
            {
              ...payload,
              type: 'expense',
              tipo: 'expense',
            },
            'expense',
          );

          return {
            goalId,
            transactionIds,
            amount: payload.valor,
            date: payload.data,
            description: payload.descricao,
            notes: payload.observacao,
          };
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        console.error('Erro ao atualizar transacao vinculada a meta:', lastError);
      }
    }

    const response = await apiService.createDespesa(payload);
    const createdIds = resolveTransactionIds(response);
    const fallbackIds = createdIds.length > 0 ? createdIds : await findGoalTransactionIdsByPayload(payload);

    if (fallbackIds.length === 0) {
      throw new Error('Meta salva, mas nao foi possivel localizar a transacao de investimento vinculada.');
    }

    return {
      goalId,
      transactionIds: fallbackIds,
      amount: payload.valor,
      date: payload.data,
      description: payload.descricao,
      notes: payload.observacao,
    };
  };

  const deleteGoalTransaction = async (link?: GoalTransactionLink) => {
    if (!link) return;

    let deleted = false;
    let lastError: unknown = null;
    for (const transactionId of link.transactionIds) {
      try {
        await apiService.deleteTransaction(transactionId, 'expense');
        deleted = true;
        break;
      } catch (error) {
        const message = String((error as any)?.message ?? '');
        if (message.includes('404')) {
          deleted = true;
          break;
        }
        lastError = error;
      }
    }

    if (!deleted && link.transactionIds.length > 0) {
      throw lastError ?? new Error('Nao foi possivel excluir a transacao vinculada a meta.');
    }
  };

  const loadCachedGoals = async () => {
    try {
      const cached = await AsyncStorage.getItem(GOALS_CACHE_KEY);
      if (!cached) return [] as Goal[];

      const parsed = JSON.parse(cached) as Goal[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erro ao carregar cache de metas:', error);
      return [] as Goal[];
    }
  };

  const loadGoals = async () => {
    try {
      const cachedGoals = await loadCachedGoals();
      const goalLinks = await loadGoalTransactionLinks();
      if (cachedGoals.length > 0) {
        setGoals(
          cachedGoals.map((goal) => ({
            ...goal,
            category: 'Investimento',
            currentAmount: goalLinks[goal.id]?.amount ?? goal.currentAmount,
          })),
        );
      }

      const rawGoals = await apiService.getMetas();
      const normalizedGoals = (rawGoals ?? []).map((goal, index) => {
        const normalizedGoal = normalizeGoal(goal, index);
        const link = goalLinks[normalizedGoal.id];

        return {
          ...normalizedGoal,
          category: 'Investimento',
          currentAmount: link?.amount ?? normalizedGoal.currentAmount,
        };
      });
      const mergedGoals = mergeGoals(cachedGoals, normalizedGoals);
      setGoals(mergedGoals);
      await persistGoals(mergedGoals);
      console.log('[Goals] loaded goals:', mergedGoals);
      return true;
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      return false;
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
      let savedGoal: Goal | null = null;
      const goalTransactionPayload = buildGoalTransactionPayload(nome, descricao, valorMeta, prazo || undefined);
      const goalLinks = await loadGoalTransactionLinks();
      let savedLink: GoalTransactionLink | null = null;

      if (editingGoalId) {
        const response = await apiService.updateMeta(editingGoalId, {
          nome,
          valorMeta,
          descricao: descricao || undefined,
          prazo: prazo || undefined,
        });
        savedGoal = {
          ...normalizeGoal(response, 0),
          category: 'Investimento',
        };
        savedLink = await syncGoalTransaction(savedGoal.id || editingGoalId, goalTransactionPayload, goalLinks[editingGoalId]);
      } else {
        const response = await apiService.createMeta({
          nome,
          valorMeta,
          descricao: descricao || undefined,
          prazo: prazo || undefined,
        });
        savedGoal = {
          ...normalizeGoal(response, 0),
          category: 'Investimento',
        };

        try {
          savedLink = await syncGoalTransaction(savedGoal.id, goalTransactionPayload);
        } catch (transactionError) {
          await apiService.deleteMeta(savedGoal.id).catch(() => null);
          throw transactionError;
        }
      }

      if (savedGoal && savedLink) {
        const nextLinks = {
          ...goalLinks,
          [savedGoal.id]: savedLink,
        };
        if (editingGoalId && editingGoalId !== savedGoal.id) {
          delete nextLinks[editingGoalId];
        }
        await persistGoalTransactionLinks(nextLinks);
        savedGoal = {
          ...savedGoal,
          currentAmount: savedLink.amount,
        };
      }

      if (savedGoal) {
        const cachedGoals = await loadCachedGoals();
        const nextGoals = editingGoalId
          ? mergeGoals(
              cachedGoals.filter((goal) => goal.id !== editingGoalId),
              [savedGoal],
            )
          : mergeGoals(cachedGoals, [savedGoal]);
        setGoals(nextGoals);
        await persistGoals(nextGoals);
      }

      const reloaded = await loadGoals();
      resetNewGoalForm();
      setEditingGoalId(null);
      setIsDialogOpen(false);
      if (!reloaded) {
        Alert.alert(
          'Sucesso parcial',
          editingGoalId
            ? 'Meta atualizada, mas a lista nao conseguiu recarregar agora.'
            : 'Meta criada, mas a lista nao conseguiu recarregar agora.',
        );
        return;
      }
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
              const goalLinks = await loadGoalTransactionLinks();
              await deleteGoalTransaction(goalLinks[goal.id]);

              setGoals((previous) => previous.filter((item) => item.id !== goal.id));
              const cachedGoals = await loadCachedGoals();
              await persistGoals(cachedGoals.filter((item) => item.id !== goal.id));
              await apiService.deleteMeta(goal.id);
              const nextLinks = { ...goalLinks };
              delete nextLinks[goal.id];
              await persistGoalTransactionLinks(nextLinks);
              const reloaded = await loadGoals();
              Alert.alert(
                reloaded ? 'Sucesso' : 'Sucesso parcial',
                reloaded
                  ? 'Meta excluida com sucesso.'
                  : 'Meta excluida, mas a lista nao conseguiu recarregar agora.',
              );
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

      const cachedGoals = await loadCachedGoals();
      if (cachedGoals.length > 0) {
        setGoals(cachedGoals);
      }

      const loaded = await loadGoals();
      if (!loaded) {
        Alert.alert('Erro ao carregar metas', 'Nao foi possivel atualizar a lista de metas agora.');
      }
    } catch (error) {
      console.error('Erro ao inicializar tela de metas:', error);
      Alert.alert('Erro ao inicializar', 'Nao foi possivel carregar as metas neste momento.');
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
    borderRightColor: 'rgba(148, 163, 184, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  pageContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
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
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.18)',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  newGoalButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  newGoalButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  goalsGrid: {
    gap: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    minHeight: 220,
    padding: 20,
  },
  emptyGoalCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
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
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 12,
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
    borderBottomColor: 'rgba(148, 163, 184, 0.14)',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 13,
    color: '#64748b',
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
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  remainingInfo: {
    gap: 4,
  },
  remainingLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  remainingDays: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eef2f7',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    borderRadius: 10,
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
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '800',
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
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
});
