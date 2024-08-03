//AccountsAuthen.js
import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import sign from '../assets/sign.png';
import hori from '../assets/hori.png';
import StartScreen from '../screens/StartScreen';

const generateRandomEmail = () => {
  const domains = ['example.com', 'mail.com', 'test.com', 'random.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomUser = Math.random().toString(36).substring(2, 11); // Generate random string of length 9
  return `${randomUser}@${randomDomain}`;
};

const AccountsAuth = ({ navigation }) => {
  const [accounts, setAccounts] = useState([{ id: 1, name: generateRandomEmail(), lastLogin: '06.14.24' }]);

  const goToStartScreen = () => {
    navigation.navigate('StartScreen');
  };

  const goToRecordAuthen = () => {
    navigation.navigate('RecordAuthen');
  };

  const addAccount = () => {
    const newAccount = { id: accounts.length + 1, name: generateRandomEmail(), lastLogin: '06.14.24' };
    setAccounts([...accounts, newAccount]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.journalTitlesub}>ACCOUNTS</Text>
      </View>

      {/* Account */}
      <View style={styles.fillOut}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {accounts.map((account) => (
            <TouchableOpacity key={account.id} style={styles.accountbutton} onPress={goToRecordAuthen}>
              <Image source={sign} style={styles.signLogo} />
              <Text style={styles.buttonText}>{account.name}</Text>
              <Text style={styles.buttonsubText}>last login {account.lastLogin}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Account */}
      <TouchableOpacity style={styles.Addbutton} onPress={addAccount}>
        <Text style={styles.AddText}>Add Account</Text>
      </TouchableOpacity>

      {/* Log out */}
      <TouchableOpacity style={styles.logOut} onPress={goToStartScreen}>
        <Text style={styles.logOut}>Log out</Text>
      </TouchableOpacity>

      <View style={styles.footnote}>
        <Image source={hori} style={styles.footnotelogo} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  fillOut: {
    marginBottom: 50,
    flex: 1,
    position: 'absolute', 
    top: '10%', 
    bottom: '9%',
    left: '7%',
    right: '7%',
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 5,
    height: 450,
    borderColor: 'gainsboro',
    borderWidth: 1,
    borderBottomWidth: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  logo: {
    bottom: 80,
    width: 150,
    height: 150,
  },
  desc: {
    fontSize: 22,
    fontWeight: '600',
    bottom: 50,
    color: '#FF9700',
    textAlign: 'justify',
  },
  desc1: {
    fontSize: 25,
    fontWeight: '600',
    top: 150,
    color: '#0B3954',
    textAlign: 'justify',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  journalTitlesub: {
    fontSize: 30,
    position: 'absolute',
    top: 10,
    fontWeight: 'bold',
    color: '#0B3954',
    zIndex: 1, // Ensure the text is above the fillOut view
  },
  signLogo: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  /* Button */
  accountbutton: {
    top: 30,
    backgroundColor: '#90DDE1',
    paddingVertical: 30,
    paddingHorizontal: 10,
    borderRadius: 15, 
    marginBottom: 10, // Add margin bottom to separate duplicated accounts
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    textAlign: 'right',
    fontWeight: 'bold',
    paddingLeft: 75,
    paddingHorizontal: 10,
  },
  buttonsubText: {
    color: '#859AA6',
    fontSize: 10,
    textAlign: 'right',
    paddingLeft: 75,
    paddingHorizontal: 10,
  },
  Addbutton: {
    top: 420,
    backgroundColor: '#0B3954',
    paddingVertical: 15,
    borderRadius: 15, 
    margin: 70,
  },
  AddText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    paddingLeft: 55,
  },
  logOut:{
    top: 180,
    left: 85,
    color: '#0B3954',
    textDecorationLine: 'underline',
    fontSize: 18,
    fontWeight: '600',
  },
  footnote: {
    flex: 1,
    top: '85%',
    position: 'absolute', 
    backgroundColor: '#0B3954',
    paddingHorizontal: '100%',
    height: 150
  },
  footnotelogo: {
    top: 10,
    position: 'absolute',
    width: 350,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
  },
});

export default AccountsAuth;
