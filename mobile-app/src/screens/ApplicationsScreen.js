import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { useApp } from '../context/AppContext';

const ApplicationsScreen = () => {
  const { applications, loadApplications } = useApp();

  useEffect(() => {
    loadApplications();
  }, []);

  const renderApplication = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.job_title}</Title>
        <Paragraph>{item.company}</Paragraph>
        <Chip style={styles.statusChip}>{item.status}</Chip>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  list: { padding: 12 },
  card: { marginBottom: 12 },
  statusChip: { marginTop: 8 },
});

export default ApplicationsScreen;
