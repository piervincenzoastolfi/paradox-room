import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fetchSceneFromAI = async (clicks, wait, profile, memory) => {
  const res = await fetch("/api/gpt-scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clicks, wait, profile, memory })
  });
  const data = await res.json();
  return data;
};

const analyzeProfile = (clicks, avgWait) => {
  if (clicks > 50) return 'impulsivo';
  if (avgWait > 10) return 'riflessivo';
  if (clicks < 10) return 'osservatore';
  return 'equilibrato';
};

const saveMemory = (clicks, totalWait, memory) => {
  localStorage.setItem('paradox_clicks', clicks);
  localStorage.setItem('paradox_wait', totalWait);
  localStorage.setItem('paradox_memory', JSON.stringify(memory));
};

const loadMemory = () => {
  const clicks = parseInt(localStorage.getItem('paradox_clicks')) || 0;
  const totalWait = parseFloat(localStorage.getItem('paradox_wait')) || 0;
  const memory = JSON.parse(localStorage.getItem('paradox_memory')) || [];
  return { clicks, totalWait, memory };
};

export default function ParadoxRoom() {
  const { clicks: savedClicks, totalWait: savedWait, memory: savedMemory } = loadMemory();

  const [current, setCurrent] = useState(null);
  const [clicks, setClicks] = useState(savedClicks);
  const [startTime, setStartTime] = useState(Date.now());
  const [totalWait, setTotalWait] = useState(savedWait);
  const [memory, setMemory] = useState(savedMemory);
  const [loopIndex, setLoopIndex] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    loadAIScene();
  }, []);

  useEffect(() => {
    if (current?.loopTexts) {
      const interval = setInterval(() => {
        setLoopIndex((i) => (i + 1) % current.loopTexts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [current]);

  useEffect(() => {
    if (current?.audio) {
      const sound = new Audio(`/audio/${current.audio}`);
      sound.volume = 0.7;
      sound.play();
      audioRef.current = sound;
      return () => sound.pause();
    }
  }, [current]);

  const loadAIScene = async () => {
    const wait = ((Date.now() - startTime) / 1000).toFixed(1);
    const newTotalWait = totalWait + parseFloat(wait);
    const avgWait = newTotalWait / (clicks || 1);
    const profile = analyzeProfile(clicks, avgWait);
    const scene = await fetchSceneFromAI(clicks, wait, profile, memory);
    setTotalWait(newTotalWait);
    setCurrent(scene);
    saveMemory(clicks, newTotalWait, [...memory, scene.title]);
  };

  const handleChoice = async (choice) => {
    if (choice.link) {
      window.open(choice.link, '_blank');
      return;
    }
    const newClicks = clicks + 1;
    setClicks(newClicks);
    setStartTime(Date.now());
    const wait = ((Date.now() - startTime) / 1000).toFixed(1);
    const newTotalWait = totalWait + parseFloat(wait);
    const avgWait = newTotalWait / newClicks;
    const profile = analyzeProfile(newClicks, avgWait);
    const nextScene = await fetchSceneFromAI(newClicks, 0, profile, memory);
    setTotalWait(newTotalWait);
    setMemory([...memory, nextScene.title]);
    setCurrent(nextScene);
    saveMemory(newClicks, newTotalWait, [...memory, nextScene.title]);
  };

  const getDescription = () => {
    let desc = current?.description || '';
    if (desc.includes('{clicks}')) desc = desc.replace('{clicks}', clicks);
    if (desc.includes('{wait}')) {
      const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
      desc = desc.replace('{wait}', seconds);
    }
    return desc;
  };

  if (!current) {
    return <div className="h-screen bg-black text-white flex items-center justify-center">Caricamento della simulazione...</div>;
  }

  return (
    <div className={`flex flex-col items-center justify-center h-screen text-white text-center px-6 transition-all duration-1000 ${current.background}`}>
      <AnimatePresence mode="wait">
        <motion.h1
          key={current.title + clicks}
          className="text-3xl mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          {current.title}
        </motion.h1>
      </AnimatePresence>
      <p className="mb-6 text-lg min-h-[80px]">
        {current.loopTexts ? current.loopTexts[loopIndex] : getDescription()}
      </p>
      <div className="flex flex-col gap-4">
        {current.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice)}
            className="bg-white text-black px-6 py-2 rounded-xl hover:scale-105 transition transform shadow-md"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
