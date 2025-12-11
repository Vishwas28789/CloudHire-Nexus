import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import ApiService from '../services/api';
import { colors } from '../utils/theme';

const DashboardScreen = ({ navigation }) => {
  const { profile, loading: globalLoading } = useApp();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading && !analytics) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Welcome, {profile?.name || 'User'}!</Title>
          <Paragraph>Your job hunting dashboard</Paragraph>
        </Card.Content>
      </Card>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>
              {analytics?.applications?.total || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Applications</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>
              {analytics?.jobs?.total || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Jobs Found</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>
              {analytics?.applications?.interview || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Interviews</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>
              {analytics?.applications?.offer || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Offers</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Success Rates */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Success Rates</Title>
          <View style={styles.rateRow}>
            <Chip
              style={styles.chip}
              textStyle={styles.chipText}
              mode="outlined"
            >
              Callback: {analytics?.rates?.callbackRate || 0}%
            </Chip>
            <Chip
              style={styles.chip}
              textStyle={styles.chipText}
              mode="outlined"
            >
              Offer: {analytics?.rates?.offerRate || 0}%
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Application Status</Title>
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <Paragraph>Pending: {analytics?.applications?.pending || 0}</Paragraph>
            </View>
            <View style={styles.statusItem}>
              <Paragraph>Applied: {analytics?.applications?.applied || 0}</Paragraph>
            </View>
            <View style={styles.statusItem}>
              <Paragraph>
                Rejected: {analytics?.applications?.rejected || 0}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('Jobs')}
            icon="briefcase"
          >
            Browse Jobs
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => navigation.navigate('Settings', { screen: 'CompanyTargeter' })}
            icon="domain"
          >
            Target Companies
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileExtractor' })}
            icon="account-arrow-right"
          >
            Extract Profile
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    margin: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.placeholder,
  },
  rateRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-around',
  },
  chip: {
    marginHorizontal: 4,
  },
  chipText: {
    fontSize: 12,
  },
  statusList: {
    marginTop: 12,
  },
  statusItem: {
    paddingVertical: 4,
  },
  button: {
    marginTop: 12,
  },
});

export default DashboardScreen;
