import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import soundPlayer from './soundPlayer';
import useBLE from './useBLE';
import { Device } from 'react-native-ble-plx';
import MovingImage from './MovingImage';

interface LockControlProps {
    deviceRef: React.MutableRefObject<Device>,
    buttonImage: any,
    // ... other props if needed
}

export default function LockControl( { deviceRef, buttonImage }: LockControlProps) {
    
    const {
        activateButton,
        queryLockState,
    } = useBLE();

    const { player } = soundPlayer();
    
    const [lockState, setLockState] = useState<boolean | number | null>(null);
    const [showGear, setShowGear] = useState<boolean>(false);

    const prevLockState = useRef<boolean | number | null>(null);
    const startupRef = useRef<boolean>(true);
    const gearRef = useRef<LottieView>(null);
    const gearAnimation = require('../assets/simple-gear.json');

    const playAnimation = () => {
        setShowGear(true);

        setTimeout(() => {
            setShowGear(false);
        }, 4000);
    };

    const sendLockCommand = async () => {
        console.log('[sendLockCommand] Sending lock command');
        
        activateButton(deviceRef.current)
            .then(() => {
                //console.log('[sendLockCommand] Lock command sent');
                queryLockState(deviceRef.current)
                    .then(state => {
                        console.log(`[sendLockCommand] Lock state is ${state}`);
                        setLockState(state);
                    });
            });
    }

    const checkLockState = async () => {
        console.log('[checkLockState] Checking lock state');
        //alert('Checking lock state...');
        // If this is the first check, just set the previous state and do nothing
        if (startupRef.current === true) {
            console.log('[checkLockState] Startup detected, setting previous state');
            prevLockState.current = lockState;
            startupRef.current = false;
        };

        // Check if there is an actual change in state
        if (lockState !== prevLockState.current) {
            //alert('[checkLockState] Lock state has changed');
            console.log('[checkLockState] Lock state has changed');
            // Update previous state
            prevLockState.current = lockState;
            // Play the animation and the sound
            playAnimation();
            try {
                player.seekTo(0)
                .then(() => {
                    //alert('[checkLockState] Playing sound 2');
                    console.log('[checkLockState] Playing sound 2');
                    player.play();
                });
            } catch (error) {
                //alert('[checkLockState] Error playing sound: ' + error);
            }
            
        };
    };

    useEffect(() => {
        checkLockState();
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
                onPress={sendLockCommand}
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
    marginHorizontal: 100,
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
  },
});