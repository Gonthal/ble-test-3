import React, {useRef, useState, useEffect} from 'react';
import {AppState, StyleSheet, Text, View} from 'react-native';

import useBLE from './useBLE';

const UseAppState = () => {
  const appState = useRef('startup');
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const {
    retrieveDevice,
    connectToDevice,
    writePassword,
    connectedDevice,
    pairedDeviceID,
    password,
    bleManager,
  } = useBLE();

  useEffect(() => {
    (async () => {
      console.log("whatever the f");
      await retrieveDevice();
    })();
  }, []);

  /*useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
        console.log("Current is", appState.current);
        if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);*/

  return (
    <>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UseAppState;