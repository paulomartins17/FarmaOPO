import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiService, MedicationBriefingData } from '../services/api.service';

export default function NewMedicationScreen() {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para consulta prévia de briefing via Gemini
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBriefing, setPreviewBriefing] = useState<MedicationBriefingData | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim() || !time.trim()) {
      Alert.alert('Dados Incompletos', 'Preencha o nome, dosagem e horário de uso.');
      return;
    }

    setLoading(true);
    try {
      await ApiService.createMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        time: time.trim(),
        observations: observations.trim() || undefined,
      });

      Alert.alert('Sucesso', 'Medicamento registrado com sucesso no sistema.', [
        { text: 'Concluir', onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar medicamento.';
      Alert.alert('Não Foi Possível Salvar', message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewBriefing = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe ao menos o nome do medicamento para consultar o briefing.');
      return;
    }

    setPreviewLoading(true);
    setPreviewModalVisible(true);
    try {
      const briefing = await ApiService.getBriefing(name.trim(), dosage.trim() || undefined);
      setPreviewBriefing(briefing);
    } catch (error) {
      setPreviewModalVisible(false);
      const message = error instanceof Error ? error.message : 'Falha ao obter análise técnica.';
      Alert.alert('Erro na Análise', message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreviewModal = () => {
    setPreviewModalVisible(false);
    setPreviewBriefing(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <MaterialIcons name="arrow-back" size={20} color="#2563EB" />
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cadastro de Medicamento</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome Comercial ou Princípio Ativo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Paracetamol"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dosagem / Concentração</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ex: 500 mg ou 10 ml"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Horário / Posologia</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="Ex: 08:00 / 16:00 ou 8/8h"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Observações Clínicas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observations}
            onChangeText={setObservations}
            placeholder="Observações complementares (opcional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={handlePreviewBriefing}
          disabled={previewLoading || loading}
        >
          <MaterialIcons name="assignment" size={18} color="#2563EB" />
          <Text style={styles.previewButtonText}>Consultar Parecer Técnico Prévia (IA)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Salvar Registro</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Briefing Prévio */}
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePreviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialIcons name="medical-services" size={20} color="#2563EB" />
                <Text style={styles.modalTitle}>Parecer Prévio Farmacológico</Text>
              </View>
              <TouchableOpacity onPress={closePreviewModal} style={styles.closeIconButton}>
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {previewLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.modalLoadingText}>Consultando base e diretrizes clínicas...</Text>
              </View>
            ) : previewBriefing ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Classe Terapêutica</Text>
                  <Text style={styles.sectionValue}>{previewBriefing.pharmacologicalClass}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Indicações Principais</Text>
                  {previewBriefing.mainIndications.map((ind, idx) => (
                    <Text key={idx} style={styles.bulletItem}>
                      • {ind}
                    </Text>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Diretrizes de Administração</Text>
                  <Text style={styles.sectionValue}>{previewBriefing.administrationGuidance}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Precauções e Interações</Text>
                  {previewBriefing.safetyWarnings.map((warn, idx) => (
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
                    {previewBriefing.mandatoryDisclaimer}
                  </Text>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={closePreviewModal}>
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
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 13,
    borderRadius: 6,
    marginBottom: 12,
  },
  previewButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
