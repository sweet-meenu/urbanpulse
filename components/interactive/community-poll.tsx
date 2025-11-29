"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export const CommunityPoll = () => {
  const [votes, setVotes] = useState([
    {
      title: "Pedestrianize Main St.",
      votes: 145,
      color: "bg-[#00E676]",
    },
    {
      title: "Add Bike Lanes",
      votes: 210,
      color: "bg-[#2979FF]",
    },
    {
      title: "Fix Streetlights",
      votes: 85,
      color: "bg-purple-500",
    },
  ]);

  return (
    <section className="bg-zinc-900/50 px-4 py-24 border-y border-white/5">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-[1fr_400px] md:gap-12">
        <Options votes={votes} setVotes={setVotes} />
        <Bars votes={votes} />
      </div>
    </section>
  );
};

const Options = ({ votes, setVotes }: any) => {
  const totalVotes = votes.reduce((acc: number, cv: any) => (acc += cv.votes), 0);

  const handleIncrementVote = (vote: any) => {
    const newVote = { ...vote, votes: vote.votes + 1 };
    setVotes((pv: any) => pv.map((v: any) => (v.title === newVote.title ? newVote : v)));
  };

  return (
    <div className="col-span-1">
      <h3 className="mb-2 text-3xl font-bold font-space text-white">
        Community Voice
      </h3>
      <p className="text-zinc-400 mb-6">Vote on the next city improvement project.</p>
      
      <div className="mb-6 space-y-3">
        {votes.map((vote: any) => {
          return (
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleIncrementVote(vote)}
              key={vote.title}
              className={`w-full rounded-xl ${vote.color} py-3 font-bold text-black shadow-lg`}
            >
              {vote.title}
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="mb-2 italic text-zinc-500">{totalVotes} votes cast today</span>
        <button
          onClick={() => {
            setVotes((pv: any) => pv.map((v: any) => ({ ...v, votes: 0 })));
          }}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
};

const Bars = ({ votes }: any) => {
  const totalVotes = votes.reduce((acc: number, cv: any) => (acc += cv.votes), 0);

  return (
    <div
      className="col-span-1 grid min-h-[200px] gap-2"
      style={{
        gridTemplateColumns: `repeat(${votes.length}, minmax(0, 1fr))`,
      }}
    >
      {votes.map((vote: any) => {
        const height = vote.votes
          ? ((vote.votes / totalVotes) * 100).toFixed(2)
          : 0;
        return (
          <div key={vote.title} className="col-span-1">
            <div className="relative flex h-full w-full items-end overflow-hidden rounded-2xl bg-zinc-800/50">
              <motion.span
                animate={{ height: `${height}%` }}
                className={`relative z-0 w-full ${vote.color} opacity-80`}
                transition={{ type: "spring" }}
              />
              <span className="absolute bottom-0 left-[50%] mt-2 inline-block w-full -translate-x-[50%] p-2 text-center text-sm text-white">
                <b className="text-xs md:text-sm">{vote.title}</b>
                <br />
                <span className="text-xs text-zinc-400">
                  {vote.votes}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
