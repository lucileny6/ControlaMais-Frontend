import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export function DashboardHeader() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

  const handleAvatarPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setDropdownPosition({ x: pageX - 200, y: pageY + 10 }); // Ajusta a posição
    setDropdownVisible(true);
  };

  const menuItems = [
    { label: 'Configurações', onPress: () => console.log('Configurações') },
    { label: 'Ajuda', onPress: () => console.log('Ajuda') },
    { label: 'Sair', onPress: () => console.log('Sair') },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Controla+</Text>
        </View>

        {/* Avatar e Menu */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={handleAvatarPress}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </TouchableOpacity>

          {/* Dropdown Menu */}
          <Modal
            visible={dropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
              <View style={styles.modalOverlay}>
                <View 
                  style={[
                    styles.dropdownContent,
                    { 
                      position: 'absolute',
                      top: dropdownPosition.y,
                      right: 16, // Posiciona à direita
                    }
                  ]}
                >
                  {/* Header do menu */}
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Usuário</Text>
                    <Text style={styles.menuSubtitle}>usuario@email.com</Text>
                  </View>

                  <View style={styles.menuSeparator} />

                  {/* Itens do menu */}
                  {menuItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                          item.onPress();
                          setDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.menuItemText}>{item.label}</Text>
                      </TouchableOpacity>
                      {index < menuItems.length - 1 && <View style={styles.menuSeparator} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#ffffff', // bg-card
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // text-primary
  },
  avatarContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownContent: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 5,
    paddingVertical: 8,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666666', // text-muted-foreground
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#000000',
  },
});