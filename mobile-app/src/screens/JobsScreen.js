import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import ApiService from '../services/api';
import { colors } from '../utils/theme';

const JobsScreen = ({ navigation }) => {
  const { jobs, loadJobs } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = jobs.filter(
        job =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchQuery, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      await loadJobs({ status: 'filtered', sortBy: 'score', order: 'DESC' });
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { job: item })}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.jobTitle}>{item.title}</Title>
            <Chip
              style={[styles.scoreChip, { backgroundColor: getScoreColor(item.score) }]}
              textStyle={styles.scoreText}
            >
              {item.score}
            </Chip>
          </View>
          <Paragraph style={styles.company}>{item.company}</Paragraph>
          <Paragraph style={styles.location}>{item.location}</Paragraph>
          <View style={styles.tags}>
            <Chip style={styles.tag} textStyle={styles.tagText}>
              {item.source}
            </Chip>
            {item.is_cloud_related === 1 && (
              <Chip style={styles.cloudTag} textStyle={styles.tagText}>
                Cloud
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const getScoreColor = score => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#FF9800';
  };

  if (loading && filteredJobs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search jobs..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filteredJobs}
        renderItem={renderJob}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Paragraph>No jobs found</Paragraph>
          </View>
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          // Trigger job scraping
          ApiService.scrapeJobs({ source: 'linkedin', keywords: 'cloud engineer' });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    margin: 12,
    elevation: 2,
  },
  list: {
    paddingHorizontal: 12,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    flex: 1,
    fontSize: 18,
    marginRight: 8,
  },
  company: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  location: {
    color: colors.placeholder,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    height: 24,
  },
  tagText: {
    fontSize: 10,
  },
  cloudTag: {
    backgroundColor: colors.info,
    marginRight: 8,
    height: 24,
  },
  scoreChip: {
    height: 28,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});

export default JobsScreen;
