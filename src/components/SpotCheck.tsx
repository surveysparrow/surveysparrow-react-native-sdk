import React from 'react';
import { WebView } from 'react-native-webview';


const Spotcheck: React.FC = () => {

    return <WebView source={{ uri: 'https://reactnative.dev/' }} style={{ flex: 1 }} />;  
}

export default Spotcheck ;