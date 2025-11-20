import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { colors } from '../utils/theme';

const JobDetailScreen = ({ route, navigation }) => {
  const { job } = route.params;

  const handleApply = async () => {
    // Navigate to application or trigger auto-apply
    navigation.navigate('Applications');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{job.title}</Title>
          <Paragraph style={styles.company}>{job.company}</Paragraph>
          <Paragraph style={styles.location}>{job.location}</Paragraph>
          
          <View style={styles.tags}>
            <Chip style={styles.tag}>Score: {job.score}</Chip>
            <Chip style={styles.tag}>{job.source}</Chip>
            {job.is_cloud_related === 1 && (
              <Chip style={styles.cloudTag}>Cloud</Chip>
            )}
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph>{job.description}</Paragraph>
          </View>

          {job.requirements && (
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Requirements</Title>
              <Paragraph>{job.requirements}</Paragraph>
            </View>
          )}

          <Button
            mode="contained"
            style={styles.applyButton}
            onPress={handleApply}
            icon="send"
          >
            Apply Now
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => {}}
            icon="open-in-new"
          >
            View Original Posting
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 12,
  },
  company: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  location: {
    color: colors.placeholder,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  cloudTag: {
    backgroundColor: colors.info,
    marginRight: 8,
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  applyButton: {
    marginTop: 24,
  },
  button: {
    marginTop: 12,
  },
});

export default JobDetailScreen;
