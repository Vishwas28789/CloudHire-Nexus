import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import ApiService from '../services/api';

const ResumeViewerScreen = () => {
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    const response = await ApiService.getResumes();
    if (response.success) setResumes(response.data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={resumes}
        renderItem={({ item }) => (
          <List.Item
            title={item.file_name}
            description={`Template: ${item.template_name}`}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});

export default ResumeViewerScreen;
