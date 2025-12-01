/**
 * ROADY Construction - Application Mobile React Native
 * Structure complète avec navigation, écrans, et composants
 */

// ============================================
// App.tsx - Point d'entrée
// ============================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import AgentChatScreen from './screens/AgentChatScreen';
import ToolsScreen from './screens/ToolsScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import CameraScreen from './screens/CameraScreen';
import ReportScreen from './screens/ReportScreen';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Accueil: 'home',
            Projets: 'folder',
            Agent: 'message-circle',
            Outils: 'tool',
            Profil: 'user',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Projets" component={ProjectsScreen} />
      <Tab.Screen name="Agent" component={AgentChatScreen} />
      <Tab.Screen name="Outils" component={ToolsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main Navigator
function MainNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OfflineProvider>
              <NavigationContainer>
                <MainNavigator />
              </NavigationContainer>
            </OfflineProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================
// screens/HomeScreen.tsx
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { data: stats } = useQuery(['dashboard-stats'], api.getDashboardStats);
  const { data: recentActivity } = useQuery(['recent-activity'], api.getRecentActivity);

  const quickActions = [
    { icon: '📸', label: 'Photo', screen: 'Camera', color: '#3b82f6' },
    { icon: '📝', label: 'Rapport', screen: 'Report', color: '#10b981' },
    { icon: '❓', label: 'RFI', screen: 'RFI', color: '#f59e0b' },
    { icon: '⚠️', label: 'Problème', screen: 'Issue', color: '#ef4444' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, Jo! 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('fr-CA', { 
          weekday: 'long', day: 'numeric', month: 'long' 
        })}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={() => navigation.navigate(action.screen as never)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.activeProjects || 0}</Text>
          <Text style={styles.statLabel}>Projets actifs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.pendingTasks || 0}</Text>
          <Text style={styles.statLabel}>Tâches en attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.openRFIs || 0}</Text>
          <Text style={styles.statLabel}>RFIs ouvertes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.teamOnSite || 0}</Text>
          <Text style={styles.statLabel}>Sur le terrain</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        {recentActivity?.map((activity: any, idx: number) => (
          <View key={idx} style={styles.activityItem}>
            <Text style={styles.activityIcon}>{activity.icon}</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{activity.description}</Text>
              <Text style={styles.activityTime}>{activity.timeAgo}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ============================================
// screens/AgentChatScreen.tsx
// ============================================

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentInfo?: { name: string; level: string };
}

export default function AgentChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour! Je suis votre assistant ROADY. Comment puis-je vous aider aujourd\'hui? 🏗️',
      timestamp: new Date(),
      agentInfo: { name: 'Core Orchestrator', level: 'L0' }
    }
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.sendAgentMessage(message),
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        agentInfo: response.agent
      }]);
    }
  });

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput('');
  };

  const suggestions = [
    "Rapport journalier",
    "État du projet",
    "Calculer béton",
    "Tâches en retard"
  ];

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.role === 'user' ? styles.userBubble : styles.assistantBubble
    ]}>
      {item.agentInfo && (
        <Text style={styles.agentTag}>
          🤖 {item.agentInfo.name} ({item.agentInfo.level})
        </Text>
      )}
      <Text style={[
        styles.messageText,
        item.role === 'user' ? styles.userText : styles.assistantText
      ]}>
        {item.content}
      </Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>🤖 Agent ROADY</Text>
        <Text style={styles.chatSubtitle}>168+ agents spécialisés</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Suggestions */}
      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => setInput(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Posez votre question..."
          placeholderTextColor="#64748b"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || chatMutation.isLoading}
        >
          <Text style={styles.sendButtonText}>
            {chatMutation.isLoading ? '...' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================
// screens/ToolsScreen.tsx - Calculateurs
// ============================================

export default function ToolsScreen() {
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);

  const calculators = [
    { id: 'concrete', name: 'Béton', icon: '🧱', color: '#64748b' },
    { id: 'loads', name: 'Charges', icon: '⚖️', color: '#3b82f6' },
    { id: 'rebar', name: 'Armatures', icon: '🔗', color: '#ef4444' },
    { id: 'paint', name: 'Peinture', icon: '🎨', color: '#ec4899' },
    { id: 'lumber', name: 'Bois', icon: '🪵', color: '#f59e0b' },
    { id: 'drywall', name: 'Gypse', icon: '📐', color: '#10b981' },
    { id: 'flooring', name: 'Plancher', icon: '🏠', color: '#8b5cf6' },
    { id: 'roofing', name: 'Toiture', icon: '🏗️', color: '#06b6d4' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>🧮 Calculateurs</Text>
      
      <View style={styles.calculatorGrid}>
        {calculators.map(calc => (
          <TouchableOpacity
            key={calc.id}
            style={[styles.calculatorCard, { borderColor: calc.color }]}
            onPress={() => setActiveCalculator(calc.id)}
          >
            <Text style={styles.calculatorIcon}>{calc.icon}</Text>
            <Text style={styles.calculatorName}>{calc.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calculator Modal would go here */}
    </View>
  );
}

// ============================================
// context/OfflineContext.tsx
// ============================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineContextType {
  isOnline: boolean;
  pendingActions: any[];
  addPendingAction: (action: any) => void;
  syncPendingActions: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncPendingActions();
      }
    });

    loadPendingActions();
    return () => unsubscribe();
  }, []);

  const loadPendingActions = async () => {
    const stored = await AsyncStorage.getItem('pendingActions');
    if (stored) setPendingActions(JSON.parse(stored));
  };

  const addPendingAction = async (action: any) => {
    const updated = [...pendingActions, { ...action, timestamp: Date.now() }];
    setPendingActions(updated);
    await AsyncStorage.setItem('pendingActions', JSON.stringify(updated));
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    for (const action of pendingActions) {
      try {
        await api[action.type](action.data);
      } catch (error) {
        console.error('Sync failed:', error);
        return;
      }
    }

    setPendingActions([]);
    await AsyncStorage.removeItem('pendingActions');
  };

  return (
    <OfflineContext.Provider value={{ isOnline, pendingActions, addPendingAction, syncPendingActions }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext)!;

// ============================================
// Styles (shared)
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: '#64748b', marginTop: 4 },
  quickActions: { flexDirection: 'row', padding: 16, gap: 12 },
  actionButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionIcon: { fontSize: 24 },
  actionLabel: { color: '#fff', fontSize: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { width: '48%', backgroundColor: '#1e293b', margin: '1%', padding: 16, borderRadius: 12 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#3b82f6' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  activityItem: { flexDirection: 'row', padding: 12, backgroundColor: '#1e293b', borderRadius: 8, marginBottom: 8 },
  activityIcon: { fontSize: 20, marginRight: 12 },
  activityContent: { flex: 1 },
  activityText: { color: '#fff', fontSize: 14 },
  activityTime: { color: '#64748b', fontSize: 12, marginTop: 2 },
  // Chat styles
  chatHeader: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  chatTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  chatSubtitle: { fontSize: 12, color: '#64748b' },
  messageList: { padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3b82f6' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#1e293b' },
  messageText: { fontSize: 15 },
  userText: { color: '#fff' },
  assistantText: { color: '#e2e8f0' },
  agentTag: { fontSize: 10, color: '#64748b', marginBottom: 4 },
  timestamp: { fontSize: 10, color: '#64748b', marginTop: 4, alignSelf: 'flex-end' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  suggestionChip: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  suggestionText: { color: '#3b82f6', fontSize: 13 },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  textInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', maxHeight: 100 },
  sendButton: { width: 44, height: 44, backgroundColor: '#3b82f6', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: '#1e293b' },
  sendButtonText: { color: '#fff', fontSize: 18 },
  // Tools
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', padding: 20, paddingTop: 60 },
  calculatorGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  calculatorCard: { width: '46%', margin: '2%', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  calculatorIcon: { fontSize: 36 },
  calculatorName: { color: '#fff', fontSize: 14, marginTop: 8, fontWeight: '600' },
});
