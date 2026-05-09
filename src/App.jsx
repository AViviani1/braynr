import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ReadingView from './components/ReadingView';
import EyeTrackingView from './components/EyeTrackingView';

export default function App() {
  const [doc, setDoc] = useState(null);
  const [eyeTracking, setEyeTracking] = useState(false);

  if (!doc) {
    return <UploadScreen onTextReady={(text, name) => setDoc({ text, name })} />;
  }

  if (eyeTracking) {
    return (
      <EyeTrackingView
        text={doc.text}
        fileName={doc.name}
        onExit={() => setEyeTracking(false)}
      />
    );
  }

  return (
    <ReadingView
      text={doc.text}
      fileName={doc.name}
      onBack={() => setDoc(null)}
      onOpenEyeTracking={() => setEyeTracking(true)}
    />
  );
}
