import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { useApp } from '../context/AppContext';

const ProfileScreen = ({ navigation }) => {
  const { profile, updateProfile } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    current_title: '',
    years_experience: '',
    skills: '',
    location: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Master Profile</Title>
      <TextInput
        label="Name"
        value={formData.name}
        onChangeText={text => setFormData({ ...formData, name: text })}
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={text => setFormData({ ...formData, email: text })}
        style={styles.input}
      />
      <TextInput
        label="Phone"
        value={formData.phone}
        onChangeText={text => setFormData({ ...formData, phone: text })}
        style={styles.input}
      />
      <TextInput
        label="Current Title"
        value={formData.current_title}
        onChangeText={text => setFormData({ ...formData, current_title: text })}
        style={styles.input}
      />
      <TextInput
        label="Years of Experience"
        value={String(formData.years_experience || '')}
        onChangeText={text => setFormData({ ...formData, years_experience: text })}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Skills"
        value={formData.skills}
        onChangeText={text => setFormData({ ...formData, skills: text })}
        style={styles.input}
        multiline
      />
      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save Profile
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('ProfileExtractor')}
        style={styles.button}
      >
        Extract from URL
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  title: { marginBottom: 16 },
  input: { marginBottom: 12 },
  button: { marginTop: 12 },
});

export default ProfileScreen;
