import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';

const SettingsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Item
          title="API Control Center"
          description="Manage API providers"
          left={props => <List.Icon {...props} icon="api" />}
          onPress={() => navigation.navigate('APIControl')}
        />
        <Divider />
        <List.Item
          title="Company Targeter"
          description="Target specific companies"
          left={props => <List.Icon {...props} icon="domain" />}
          onPress={() => navigation.navigate('CompanyTargeter')}
        />
        <Divider />
        <List.Item
          title="Feature Builder"
          description="AI-powered rule builder"
          left={props => <List.Icon {...props} icon="auto-fix" />}
          onPress={() => navigation.navigate('FeatureBuilder')}
        />
        <Divider />
        <List.Item
          title="Resume Viewer"
          description="View and manage resumes"
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={() => navigation.navigate('ResumeViewer')}
        />
        <Divider />
        <List.Item
          title="Notifications"
          description="Notification settings"
          left={props => <List.Icon {...props} icon="bell" />}
          onPress={() => navigation.navigate('Notifications')}
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});

export default SettingsScreen;
