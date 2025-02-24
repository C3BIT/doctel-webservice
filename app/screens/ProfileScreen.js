import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  // Platform,
  KeyboardAvoidingView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { Card } from './../components/common/Card';
import { Input } from './../components/common/Input';
import { Button } from './../components/common/Button';

export const ProfileScreen = () => {
  const [profile, setProfile] = useState({
    name: 'Amar name ki',
    bloodGroup: 'O+',
    gender: 'Male',
    dateOfBirth: '1999/09/21',
    mobileNumber: '0123 456 789',
    height: '1.65',
    weight: '48'
  });

  const handleUpdate = () => {
    console.log('Profile updated:', profile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>Profile</Text>
          
          <Card>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/avatar.png')}
                style={styles.avatar}
              />
            </View>

            <Input
              label="First name & Last name"
              value={profile.name}
              onChangeText={(text) => setProfile({...profile, name: text})}
            />

            <View style={styles.row}>
              <Input
                label="Blood group"
                value={profile.bloodGroup}
                containerStyle={styles.halfInput}
                rightElement={<Text style={styles.dropdownIcon}>▼</Text>}
              />
              <Input
                label="Gender"
                value={profile.gender}
                containerStyle={styles.halfInput}
                rightElement={<Text style={styles.dropdownIcon}>▼</Text>}
              />
            </View>

            <Input
              label="Date of birth"
              value={profile.dateOfBirth}
              rightElement={<Calendar size={20} color="#666" />}
            />

            <Input
              label="Mobile Number"
              value={profile.mobileNumber}
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <Input
                label="Height (m)"
                value={profile.height}
                keyboardType="decimal-pad"
                containerStyle={styles.halfInput}
              />
              <Input
                label="Weight (kg)"
                value={profile.weight}
                keyboardType="decimal-pad"
                containerStyle={styles.halfInput}
              />
            </View>

            <Button
              title="Update"
              onPress={handleUpdate}
              style={styles.updateButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20ACE2',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#223972',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
    // paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
  },
  rightElement: {
    marginLeft: 8,
  },
});

