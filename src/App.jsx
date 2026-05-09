import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ReadingView from './components/ReadingView';

export default function App() {
  const [doc, setDoc] = useState(null);

  if (!doc) {
    return <UploadScreen onTextReady={(text, name) => setDoc({ text, name })} />;
  }

  return (
    <ReadingView
      text={doc.text}
      fileName={doc.name}
      onBack={() => setDoc(null)}
    />
  );
}
