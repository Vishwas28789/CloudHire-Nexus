import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, Paragraph } from 'react-native-paper';
import ApiService from '../services/api';

const CompanyTargeterScreen = () => {
  const [companies, setCompanies] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTarget = async () => {
    setLoading(true);
    const companyList = companies.split('\n').filter(c => c.trim());
    await ApiService.targetCompanies(companyList);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Title>Company Targeter</Title>
      <Paragraph>Paste company names (one per line)</Paragraph>
      <TextInput
        mode="outlined"
        multiline
        numberOfLines={10}
        value={companies}
        onChangeText={setCompanies}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleTarget} loading={loading}>
        Target Companies
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  input: { marginVertical: 16 },
});

export default CompanyTargeterScreen;
