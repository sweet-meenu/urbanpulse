"use client";
import { AnimatePresence, useAnimate, usePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FiClock, FiPlus, FiTrash2, FiCheck } from "react-icons/fi";
import { motion } from "framer-motion";

export const GreenChecklist = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: "Walked to work (2km)", checked: true, points: "+50 XP" },
    { id: 2, text: "Reported Pothole", checked: false, points: "+20 XP" },
    { id: 3, text: "Used Public Transport", checked: false, points: "+30 XP" },
    { id: 4, text: "Recycled Electronics", checked: false, points: "+100 XP" },
  ]);

  const handleCheck = (id: number) => {
    setTodos((pv) =>
      pv.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const removeElement = (id: number) => {
    setTodos((pv) => pv.filter((t) => t.id !== id));
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="mb-6 flex justify-between items-end">
          <div>
             <h3 className="text-xl font-bold text-white">Daily Impact</h3>
             <p className="text-zinc-400 text-sm">Log actions, earn $PULSE.</p>
          </div>
          <span className="text-[#00E676] font-mono text-sm">Level 5 User</span>
        </div>
        
        <div className="w-full space-y-3">
            <AnimatePresence>
                {todos.map((t) => (
                <Todo key={t.id} {...t} handleCheck={handleCheck} removeElement={removeElement} />
                ))}
            </AnimatePresence>
        </div>
        <Form setTodos={setTodos} />
    </div>
  );
};

const Form = ({ setTodos }: any) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!text.length) return;
    setTodos((pv: any) => [
      { id: Math.random(), text, checked: false, points: "+10 XP" },
      ...pv,
    ]);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
       <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Log new activity..."
          className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
        />
        <button type="submit" className="bg-[#00E676] text-black rounded-xl px-4 hover:bg-[#00E676]/80 transition-colors">
            <FiPlus size={20} />
        </button>
    </form>
  );
};

const Todo = ({ id, text, checked, points, handleCheck, removeElement }: any) => {
  const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!isPresent) {
      const exit = async () => {
        await animate(scope.current, { opacity: 0, x: -20 }, { duration: 0.2 });
        safeToRemove();
      };
      exit();
    }
  }, [isPresent]);

  return (
    <motion.div
      ref={scope}
      layout
      className={`relative flex w-full items-center gap-3 rounded-xl border p-3 transition-colors ${
        checked ? "bg-[#00E676]/10 border-[#00E676]/30" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <button 
        onClick={() => handleCheck(id)}
        className={`size-6 rounded-full border flex items-center justify-center transition-colors ${
            checked ? "bg-[#00E676] border-[#00E676] text-black" : "border-zinc-600 text-transparent hover:border-[#00E676]"
        }`}
      >
        <FiCheck size={14} strokeWidth={3} />
      </button>

      <span className={`text-sm font-medium ${checked ? "text-zinc-500 line-through" : "text-white"}`}>
        {text}
      </span>
      
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs font-mono text-[#00E676]">{points}</span>
        <button onClick={() => removeElement(id)} className="text-zinc-600 hover:text-red-400">
          <FiTrash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};
