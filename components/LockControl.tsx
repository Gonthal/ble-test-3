import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import soundPlayer from '../hooks/soundPlayer';
import useBLE from '../hooks/useBLE';
import { Device } from 'react-native-ble-plx';
import MovingImage from './MovingImage';

interface LockControlProps {
    deviceRef: React.MutableRefObject<Device | null>,
    buttonImage: any,
    lockState: number,
    activateButton: (device: Device | null) => Promise<void>
    // ... other props if needed
}

export default function LockControl({
    deviceRef,
    buttonImage,
    lockState,      // Received from App.tsx
    activateButton  // Received from App.tsx
}: LockControlProps) {

    const { player } = soundPlayer();
    
    //const [lockState, setLockState] = useState<boolean | number | null>(null);
    const [showGear, setShowGear] = useState<boolean>(false);

    const prevLockStateRef = useRef<number | null>(null);
    //const startupRef = useRef<boolean>(true);
    const gearRef = useRef<LottieView>(null);
    const gearAnimation = require('../assets/simple-gear.json');

    const isSyncingRef = useRef<boolean>(true);
    const userInitiatedRef = useRef<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            isSyncingRef.current = false;
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    const playAnimation = () => {
        setShowGear(true);
        setTimeout(() => setShowGear(false), 4000);
    };

    // Create a reference to hold the active timer
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Start firing the signal the moment the user touches the screen
    const handlePressIn = async () => {
        // User touched the button, so instantly allow animations
        userInitiatedRef.current = true;
        isSyncingRef.current = false;

        // Fire immediately on the first touch
        activateButton(deviceRef.current);
        // Then set up a loop to keep firing every 150ms
        timerRef.current = setInterval(() => {
            activateButton(deviceRef.current);
        }, 150);
    };

    const handlePressOut = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    // Send BLE command to open or close the lock
    const sendLockCommand = async () => {
        if (deviceRef.current) {
            console.log('[sendLockCommand] Sending lock command');
            activateButton(deviceRef.current);
        }
    }

    // Play animation and sound based on whether the lock changed its state 
    useEffect(() => {
        if (lockState === -1) return;

        const isFirstRead = prevLockStateRef.current === null;
        const isStateChange = lockState !== prevLockStateRef.current;

        if (!isFirstRead && !isStateChange) return;

        console.log('[LockControl] State update: ${lockState} (First read: ${isFirstRead})');
        prevLockStateRef.current = lockState;

        if (isSyncingRef.current && !userInitiatedRef.current) {
            return;
        }

        playAnimation();
        try {
            player.seekTo(0).then(() => player.play());
        } catch (error) {
            console.log('[LockControl] Sound error:', error);
        }
        
        /*// Ignore initial state or invalid states
        if (lockState === -1) return;

        if (prevLockStateRef.current === null) {
            prevLockStateRef.current = lockState;
            return;
        }

        // Only run is the state actually changed
        if (lockState !== prevLockStateRef.current) {
            console.log('[LockControl] State changed to:', lockState);
            prevLockStateRef.current = lockState;

            // Only animate if the sync window finished OR the user pressed the button
            if (!isSyncingRef.current || userInitiatedRef.current) {
                // Play effects
                playAnimation();
                try {
                    player.seekTo(0).then(() => player.play());
                } catch (error) {
                    console.log('[LockControl] Sound error:', error);
                }
            }
            // Play effects
            playAnimation();
            try {
                player.seekTo(0).then(() => player.play());
            } catch (error) {
                console.log('[LockControl] Sound error:', error);
            }
        }*/
    }, [lockState]);

    return (
        <>
            {showGear && (
                <MovingImage
                    animation={gearRef}
                    source={gearAnimation}
                    visibility={showGear}
                />
            )}
            <TouchableOpacity
                //onPress={sendLockCommand}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.activateButton}
            >
                <Image source={buttonImage} style={styles.activateButtonImage}/>
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
  regularButton: {
    backgroundColor: "#C0C0C0", // Argentinian blue
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    width: 100,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  regularButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9F9F9", // Seasalt
  },
  activateButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    width: 150,
    marginBottom: 10,
    borderRadius: 100,
  },
  activateButtonImage: {
    width: 150,
    height: 150,
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});