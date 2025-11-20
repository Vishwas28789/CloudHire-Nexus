import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import ApiService from '../services/api';

const ProfileExtractorScreen = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    await ApiService.extractProfile(url);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Title>Profile Extractor</Title>
      <TextInput
        mode="outlined"
        label="LinkedIn/GitHub/Portfolio URL"
        value={url}
        onChangeText={setUrl}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleExtract} loading={loading}>
        Extract Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  input: { marginVertical: 16 },
});

export default ProfileExtractorScreen;
