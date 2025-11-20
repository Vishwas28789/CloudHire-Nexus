import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { useApp } from '../context/AppContext';

const NotificationsScreen = () => {
  const { notifications, loadNotifications } = useApp();

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={item.message}
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

export default NotificationsScreen;
