import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import ApiService from '../services/api';

const FeatureBuilderScreen = () => {
  const [instruction, setInstruction] = useState('');

  const handleCreate = async () => {
    await ApiService.createFeatureRule({ instruction });
  };

  return (
    <View style={styles.container}>
      <Title>Feature Builder</Title>
      <TextInput
        mode="outlined"
        multiline
        numberOfLines={5}
        placeholder="Enter natural language instruction..."
        value={instruction}
        onChangeText={setInstruction}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleCreate}>
        Create Rule
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  input: { marginVertical: 16 },
});

export default FeatureBuilderScreen;
