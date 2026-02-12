import React, { FC, useCallback } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    Modal,
    SafeAreaView,
    Text,
    StyleSheet,
    TouchableOpacity,
    Touchable,
} from "react-native";
import { Device } from "react-native-ble-plx";

type DeviceModalListItemProps = {
    item: ListRenderItemInfo<Device>;
    connectToPeripheral: (device: Device | null, id: string | null) => void;
    closeModal: () => void;
};

type DeviceModalProps = {
    devices: Device[];
    visible: boolean;
    connectToPeripheral: (device: Device | null, id: string | null) => void;
    closeModal: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
    const { item, connectToPeripheral, closeModal } = props;

    const connectAndCloseModal = useCallback(() => {
        connectToPeripheral(item.item, null);
        closeModal();
    }, [closeModal, connectToPeripheral, item.item]);

    return (
      <TouchableOpacity
        onPress={connectAndCloseModal}
        style={modalStyle.regularButton}
      >
        <Text style={modalStyle.regularButtonText}>
          {item.item.name ?? item.item.localName}
        </Text>
      </TouchableOpacity>
    );
  
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral]
  );

  return (
    <Modal
      style={modalStyle.modalContainer}
      animationType="slide"
      transparent={false}
      visible={visible}
    >
      <SafeAreaView style={modalStyle.modalTitle}>
        <Text style={modalStyle.modalTitleText}>
          Tap on a device to connect
        </Text>
        <FlatList
          contentContainerStyle={modalStyle.modalFlatlistContiner}
          data={devices}
          renderItem={renderDeviceModalListItem}
        />
        <TouchableOpacity
          onPress={closeModal}
          style={modalStyle.regularButton}
        >
          <Text style={modalStyle.regularButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const modalStyle = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "#414141",
    },
    modalFlatlistContiner: {
      flex: 1,
      justifyContent: "center",
    },
    modalCellOutline: {
      borderWidth: 1,
      borderColor: "black",
      alignItems: "center",
      marginHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 8,
    },
    modalTitle: {
      flex: 1,
      backgroundColor: "#414141",
    },
    modalTitleText: {
      marginTop: 40,
      fontSize: 30,
      fontWeight: "bold",
      marginHorizontal: 20,
      textAlign: "center",
      color: '#F9F9F9',
    },
    regularButton: {
      backgroundColor: "#C0C0C0",
      justifyContent: "center",
      alignItems: "center",
      height: 60,
      marginHorizontal: 20,
      marginBottom: 5,
      borderRadius: 8,
    },
    regularButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#F9F9F9",
    },
  });

  export default DeviceModal;