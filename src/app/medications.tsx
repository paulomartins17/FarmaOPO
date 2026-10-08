import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiService, MedicationItem, MedicationBriefingData } from '../services/api.service';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<MedicationBriefingData | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getMedications();
      setMedications(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na comunicação com o servidor.';
      Alert.alert('Erro no Servidor', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Confirmação de Exclusão',
      `Deseja realmente remover o registro de "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteMedication(id);
              setMedications(prev => prev.filter(m => m.id !== id));
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Falha ao excluir o registro.';
              Alert.alert('Erro', message);
            }
          },
        },
      ]
    );
  };

  const handleOpenBriefing = async (medication: MedicationItem) => {
    setBriefingLoading(true);
    setModalVisible(true);
    try {
      const briefing = await ApiService.getBriefingById(medication.id);
      setSelectedBriefing(briefing);
    } catch {
      try {
        const fallbackBriefing = await ApiService.getBriefing(medication.name, medication.dosage);
        setSelectedBriefing(fallbackBriefing);
      } catch (err) {
        setModalVisible(false);
        const message = err instanceof Error ? err.message : 'Não foi possível carregar o parecer.';
        Alert.alert('Falha na Consulta', message);
      }
    } finally {
      setBriefingLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBriefing(null);
  };

  const renderItem = ({ item }: { item: MedicationItem }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDetail}>Dosagem: {item.dosage}</Text>
        <Text style={styles.cardDetail}>Horário: {item.time}</Text>
        {item.observations ? (
          <Text style={styles.cardObs}>Obs: {item.observations}</Text>
        ) : null}
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity
          style={styles.briefingButton}
          onPress={() => handleOpenBriefing(item)}
        >
          <MaterialIcons name="info-outline" size={16} color="#2563EB" />
          <Text style={styles.briefingButtonText}>Briefing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <MaterialIcons name="delete-outline" size={16} color="#DC2626" />
          <Text style={styles.deleteText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <MaterialIcons name="arrow-back" size={20} color="#2563EB" />
          <Text style={styles.backButton}>Painel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medicamentos</Text>
        <TouchableOpacity onPress={fetchMedications} style={styles.navButton}>
          <MaterialIcons name="refresh" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : (
        <FlatList
          data={medications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum medicamento registrado na base.</Text>
          }
        />
      )}

      {/* Modal Técnico de Briefing Clínico */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialIcons name="medical-services" size={20} color="#2563EB" />
                <Text style={styles.modalTitle}>
                  {selectedBriefing ? selectedBriefing.medicationName : 'Briefing Clínico'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeIconButton}>
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {briefingLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.modalLoadingText}>Gerando análise clínica via IA...</Text>
              </View>
            ) : selectedBriefing ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Classe Terapêutica</Text>
                  <Text style={styles.sectionValue}>{selectedBriefing.pharmacologicalClass}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Indicações Principais</Text>
                  {selectedBriefing.mainIndications.map((ind, idx) => (
                    <Text key={idx} style={styles.bulletItem}>
                      • {ind}
                    </Text>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Administração e Posologia</Text>
                  <Text style={styles.sectionValue}>{selectedBriefing.administrationGuidance}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Advertências e Precauções</Text>
                  {selectedBriefing.safetyWarnings.map((warn, idx) => (
                    <Text key={idx} style={styles.bulletItem}>
                      • {warn}
                    </Text>
                  ))}
                </View>

                <View style={styles.disclaimerBox}>
                  <View style={styles.disclaimerHeader}>
                    <MaterialIcons name="warning-amber" size={18} color="#92400E" />
                    <Text style={styles.disclaimerTitle}>Aviso Regulatório Obrigatório</Text>
                  </View>
                  <Text style={styles.disclaimerText}>
                    {selectedBriefing.mandatoryDisclaimer}
                  </Text>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backButton: {
    color: '#2563EB',
    fontSize: 15,
    marginLeft: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 1,
  },
  cardObs: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  briefingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  briefingButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closeIconButton: {
    padding: 4,
  },
  modalLoadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 2,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
