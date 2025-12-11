import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch, Button, Divider } from 'react-native-paper';
import ApiService from '../services/api';

const APIControlScreen = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const response = await ApiService.getAPIConfig();
    if (response.success) setConfig(response.data);
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section title="Email Services">
        {config?.email?.providers?.map(p => (
          <List.Item
            key={p.name}
            title={p.name}
            right={() => <Switch value={p.enabled} />}
          />
        ))}
      </List.Section>
      <Divider />
      <List.Section title="AI Providers">
        {config?.ai?.providers?.map(p => (
          <List.Item
            key={p.name}
            title={p.name}
            description={p.model}
            right={() => <Switch value={p.enabled} />}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});

export default APIControlScreen;
