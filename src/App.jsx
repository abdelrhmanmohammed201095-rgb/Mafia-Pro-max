import React, { useState, useEffect } from 'react';
import { 
  Shield, Eye, Moon, Sun, Skull, Award, UserX, AlertTriangle, 
  Check, Volume2, VolumeX, Sparkles, ChevronRight, RefreshCw, Flame, Lock, Info, Users, UserCheck
} from 'lucide-react';

// --- WEB AUDIO API SOUND EFFECTS & MUSIC ENGINE ---
const playSound = (type, soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'night') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'day') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'win_town') {
      // Happy upbeat fanfare
      osc.type = 'square';
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.2);
      });
    } else if (type === 'win_mafia') {
      // Dark evil cinematic doom sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'vote_evil_eliminated') {
      // Happy joyful chime when mafia caught
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.1);
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, now + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
        o.start(now + idx * 0.1);
        o.stop(now + idx * 0.1 + 0.25);
      });
    } else if (type === 'vote_citizen_eliminated') {
      // Sad gloomy sound when innocent is eliminated
      const now = ctx.currentTime;
      [300, 250, 200].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, now + idx * 0.15);
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, now + idx * 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.3);
        o.start(now + idx * 0.15);
        o.stop(now + idx * 0.15 + 0.3);
      });
    }
  } catch (e) {
    console.error(e);
  }
};

// --- GAME CONSTANTS & INITIAL DATA ---
const TRAITOR_MISSIONS = [
  "قم بقيادة التهمة وطرد أي مواطن صالح في أول تصويت نهار.",
  "حافظ على حياتك وكن ضمن آخر 3 لاعبين متبقين في اللعبة.",
  "اجعل التصويت ينتهي بالتعادل (عدم طرد أحد) في إحدى الجولات الصباحية.",
  "صوّت ضد المافيا دون أن يكتشفوا أنك الخاين.",
  "اقنع الجميع أنك العمدة أو الدكتور في المناقشات."
];

const ROLES_INFO = {
  MAFIA: {
    name: 'مافيا تقليدي',
    team: 'mafia',
    icon: Skull,
    color: 'from-red-600 to-rose-900',
    badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
    description: 'تتفق مع المافيا لاختيار ضحية لقتلها كل ليلة.'
  },
  CHEMIST: {
    name: 'الكيميائي',
    team: 'mafia',
    icon: Flame,
    color: 'from-amber-600 to-orange-900',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    description: 'تضع سماً منوّماً يمنع أي شخص من الكلام والتصويت في النهار التالي. يمكنك تنويم أي لاعب باللعبة.'
  },
  SPY: {
    name: 'الجاسوس',
    team: 'mafia',
    icon: Eye,
    color: 'from-purple-600 to-indigo-900',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    description: 'تظهر للمدينة كمواطن عادي، لكنك تعرف فريق المافيا وتتوارث أدوارهم عند موتهم!'
  },
  MAYOR: {
    name: 'العمدة',
    team: 'town',
    icon: Award,
    color: 'from-amber-400 to-yellow-600',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    description: 'يمكنك كشف شارتك الرسمية في أي نهار لحساب صوتك بصوتين في التصويت.'
  },
  DOCTOR: {
    name: 'الدكتور',
    team: 'town',
    icon: Shield,
    color: 'from-emerald-500 to-teal-800',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    description: 'تختار شخصاً واحداً كل ليلة لحمايته من الاغتيال.'
  },
  SNIPER: {
    name: 'القناص الصالح',
    team: 'town',
    icon: UserX,
    color: 'from-blue-600 to-cyan-900',
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    description: 'لديك رصاصة واحدة فقط! إن أصبت مافيا يقتل، وإن أصبت صالحاً تموت أنت وهو فوراً.'
  },
  CITIZEN: {
    name: 'مواطن عادي',
    team: 'town',
    icon: Users,
    color: 'from-slate-600 to-gray-800',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'ليس لديك قدرة ليلية، سلاحك هو قوة التحليل والتصويت في النهار.'
  },
  TRAITOR: {
    name: 'الخاين',
    team: 'neutral',
    icon: Sparkles,
    color: 'from-pink-600 to-fuchsia-900',
    badgeBg: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    description: 'لاعب محايد لديه مهمة سرية خبيثة لإحداث الفوضى.'
  }
};

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- GAME STATES ---
  const [gameState, setGameState] = useState('Setup');
  const [playerNamesInput, setPlayerNamesInput] = useState('');
  const [players, setPlayers] = useState([]);
  
  // Turn indices
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  // Role reveal tracking
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [permanentlyHidden, setPermanentlyHidden] = useState({});

  // Night Choices
  const [nightActions, setNightActions] = useState({
    mafiaTarget: null,
    chemistTarget: null,
    doctorTarget: null,
    sniperTarget: null
  });

  const [spyChoice, setSpyChoice] = useState(null); // 'mafia' or 'chemist'

  // Day states
  const [mutedPlayerId, setMutedPlayerId] = useState(null);
  const [nightStory, setNightStory] = useState('');
  const [displayedStory, setDisplayedStory] = useState('');
  const [storyFinished, setStoryFinished] = useState(false);

  // Voting states
  const [votes, setVotes] = useState({});
  const [hasVoted, setHasVoted] = useState({});
  const [voteResultData, setVoteResultData] = useState(null);

  // Winner state
  const [winnerTeam, setWinnerTeam] = useState(null);

  // --- HELPER FUNCTIONS ---
  const isMafiaGroup = (roleKey) => ['MAFIA', 'CHEMIST', 'SPY'].includes(roleKey);

  const getDisplayedRoleName = (roleKey) => {
    if (roleKey === 'SPY') return ROLES_INFO.CITIZEN.name;
    return ROLES_INFO[roleKey].name;
  };

  const getMafiaTeammates = () => {
    return players.filter(p => isMafiaGroup(p.role));
  };

  const isRoleAlive = (roleKey) => players.some(p => p.role === roleKey && p.isAlive);

  // --- SETUP GAME ---
  const handleStartGame = () => {
    playSound('click', soundEnabled);
    const names = playerNamesInput
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length < 5) {
      alert('الرجاء إدخال 5 أسماء على الأقل لبدء اللعبة بشكل متوازن!');
      return;
    }

    let pool = ['MAFIA', 'CHEMIST', 'DOCTOR', 'MAYOR', 'SNIPER', 'TRAITOR'];
    if (names.length >= 7) pool.push('SPY');
    
    while (pool.length < names.length) {
      pool.push('CITIZEN');
    }

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    const createdPlayers = names.map((name, idx) => {
      const roleKey = shuffledPool[idx];
      return {
        id: idx + 1,
        name: name,
        role: roleKey,
        isAlive: true,
        hasSniperShot: roleKey === 'SNIPER',
        isMayorRevealed: false,
        traitorMission: roleKey === 'TRAITOR' ? TRAITOR_MISSIONS[Math.floor(Math.random() * TRAITOR_MISSIONS.length)] : null,
      };
    });

    setPlayers(createdPlayers);
    setCurrentTurnIndex(0);
    setRoleRevealed(false);
    setPermanentlyHidden({});
    setGameState('RoleReveal');
  };

  // --- ROLE REVEAL STEP ---
  const handleConfirmRoleSeen = (playerId) => {
    playSound('click', soundEnabled);
    setPermanentlyHidden(prev => ({ ...prev, [playerId]: true }));
    setRoleRevealed(false);
    
    if (currentTurnIndex < players.length - 1) {
      setCurrentTurnIndex(prev => prev + 1);
    } else {
      setCurrentTurnIndex(0);
      setGameState('NightPass');
      playSound('night', soundEnabled);
    }
  };

  // --- NIGHT PHASE HELPERS ---
  const alivePlayers = players.filter(p => p.isAlive);
  const currentNightPlayer = alivePlayers[currentTurnIndex];

  // --- INSTANT ACTION & PASS (FAIR PLAY ENFORCED) ---
  const handleNightActionAndAdvance = (actionType, targetId) => {
    playSound('click', soundEnabled);

    // Update specific night target
    let updatedActions = { ...nightActions };
    if (actionType === 'mafia') updatedActions.mafiaTarget = targetId;
    if (actionType === 'chemist') updatedActions.chemistTarget = targetId;
    if (actionType === 'doctor') updatedActions.doctorTarget = targetId;
    if (actionType === 'sniper') updatedActions.sniperTarget = targetId;
    if (actionType === 'none') {
      // For roles with no active night target or passing action
    }
    setNightActions(updatedActions);

    // Instantly advance to next player or process night results
    if (currentTurnIndex < alivePlayers.length - 1) {
      setCurrentTurnIndex(prev => prev + 1);
      setGameState('NightPass');
    } else {
      processNightResults(updatedActions);
    }
  };

  // --- NIGHT RESULTS LOGIC ---
  const processNightResults = (finalNightActions) => {
    let killedPlayerIds = new Set();
    let storyEvents = [];
    let newMutedId = finalNightActions.chemistTarget;

    setMutedPlayerId(newMutedId);

    const protectedId = finalNightActions.doctorTarget;
    const mafiaTargetId = finalNightActions.mafiaTarget;

    if (mafiaTargetId) {
      const targetPlayer = players.find(p => p.id === mafiaTargetId);
      if (mafiaTargetId === protectedId) {
        storyEvents.push(`حاولت قوات المافيا تنفيذ عملية اغتيال ليلية، ولكن تدخل الدكتور في الوقت المناسب أنقذ الضحية من موت محقق!`);
      } else {
        killedPlayerIds.add(mafiaTargetId);
        storyEvents.push(`عثر أهالي المدينة مع إشراق الصباح على جثة المظلوم (${targetPlayer.name}) بعد أن طالته أيادي المافيا الغادرة.`);
      }
    } else {
      storyEvents.push(`مرت الليلة هادئة نسبياً ولم تسجل المافيا أي حالة اغتيال.`);
    }

    if (newMutedId) {
      const mutedPlayer = players.find(p => p.id === newMutedId);
      storyEvents.push(`استيقظ (${mutedPlayer.name}) وهو يشعر بتعب شديد وفقدان كامل للقدرة على الكلام والتصويت بسبب سم الكيميائي المنوّم!`);
    }

    const sniperTargetId = finalNightActions.sniperTarget;
    if (sniperTargetId) {
      const sniperPlayer = players.find(p => p.role === 'SNIPER');
      const sniperTarget = players.find(p => p.id === sniperTargetId);

      if (sniperTarget) {
        const isEvilTarget = sniperTarget.role === 'MAFIA' || sniperTarget.role === 'CHEMIST';

        if (isEvilTarget) {
          killedPlayerIds.add(sniperTargetId);
          storyEvents.push(`صوت رصاصة قناص دوّى في الظلام! استطاع القناص الصالح تصفية أحد عناصر الشر (${sniperTarget.name}).`);
        } else {
          killedPlayerIds.add(sniperTargetId);
          if (sniperPlayer && sniperPlayer.isAlive) {
            killedPlayerIds.add(sniperPlayer.id);
          }
          storyEvents.push(`كارثة! أطلق القناص رصاصته بالخطأ على المواطن الصالح (${sniperTarget.name})، وشعوراً بالذنب والمسؤولية تم إقصاء القناص (${sniperPlayer?.name}) معه فوراً!`);
        }
      }
    }

    const updatedPlayers = players.map(p => {
      let updated = { ...p };
      if (killedPlayerIds.has(p.id)) {
        updated.isAlive = false;
      }
      if (p.role === 'SNIPER' && sniperTargetId) {
        updated.hasSniperShot = false;
      }
      return updated;
    });

    setPlayers(updatedPlayers);

    setNightActions({
      mafiaTarget: null,
      chemistTarget: null,
      doctorTarget: null,
      sniperTarget: null
    });
    setSpyChoice(null);

    const fullStoryText = storyEvents.join("\n\n");
    setNightStory(fullStoryText);
    setDisplayedStory('');
    setStoryFinished(false);

    const win = checkWinConditions(updatedPlayers);
    if (win) {
      setWinnerTeam(win);
      setGameState('GameOver');
      if (win.team === 'mafia') playSound('win_mafia', soundEnabled);
      else playSound('win_town', soundEnabled);
    } else {
      setGameState('NightSummary');
      playSound('day', soundEnabled);
    }
  };

  // --- TYPEWRITER EFFECT FOR NIGHT STORY ---
  useEffect(() => {
    if (gameState === 'NightSummary' && nightStory) {
      let i = 0;
      setDisplayedStory('');
      setStoryFinished(false);
      const timer = setInterval(() => {
        if (i < nightStory.length) {
          setDisplayedStory(prev => prev + nightStory.charAt(i));
          i++;
        } else {
          setStoryFinished(true);
          clearInterval(timer);
        }
      }, 25);
      return () => clearInterval(timer);
    }
  }, [gameState, nightStory]);

  const handleSkipStory = () => {
    playSound('click', soundEnabled);
    setDisplayedStory(nightStory);
    setStoryFinished(true);
  };

  // --- DAY VOTING PHASE ---
  const handleStartVotingPhase = () => {
    playSound('click', soundEnabled);
    setCurrentTurnIndex(0);
    setVotes({});
    setHasVoted({});
    setGameState('DayVoteAction');
  };

  // --- INSTANT VOTE ACTION & PASS (FAIR PLAY ENFORCED) ---
  const handleCastVoteAndAdvance = (voterId, targetId) => {
    playSound('click', soundEnabled);
    const voter = players.find(p => p.id === voterId);
    const voteWeight = (voter && voter.role === 'MAYOR' && voter.isMayorRevealed) ? 2 : 1;

    let updatedVotes = { ...votes };
    if (targetId !== 0) {
      updatedVotes[targetId] = (updatedVotes[targetId] || 0) + voteWeight;
    }
    setVotes(updatedVotes);

    setHasVoted(prev => ({ ...prev, [voterId]: true }));

    if (currentTurnIndex < alivePlayers.length - 1) {
      setCurrentTurnIndex(prev => prev + 1);
      setGameState('DayVoteAction');
    } else {
      processVoteResults(updatedVotes);
    }
  };

  const handleToggleMayorBadge = (mayorId) => {
    playSound('click', soundEnabled);
    setPlayers(prev => prev.map(p => p.id === mayorId ? { ...p, isMayorRevealed: true } : p));
  };

  // --- PROCESS VOTE RESULTS ---
  const processVoteResults = (finalVotes) => {
    let maxVotes = 0;
    let topTargets = [];

    Object.entries(finalVotes).forEach(([targetIdStr, count]) => {
      const targetId = parseInt(targetIdStr);
      if (targetId !== 0) {
        if (count > maxVotes) {
          maxVotes = count;
          topTargets = [targetId];
        } else if (count === maxVotes) {
          topTargets.push(targetId);
        }
      }
    });

    let resultInfo = {
      eliminatedPlayer: null,
      isTie: false,
      maxVotes: maxVotes,
      votesSummary: { ...finalVotes }
    };

    if (topTargets.length === 1 && maxVotes > 0) {
      const eliminatedId = topTargets[0];
      const playerToEliminate = players.find(p => p.id === eliminatedId);
      
      resultInfo.eliminatedPlayer = playerToEliminate;

      // Play appropriate sound depending on whether an evil role or innocent was eliminated!
      const isEvilEliminated = isMafiaGroup(playerToEliminate.role);
      if (isEvilEliminated) {
        playSound('vote_evil_eliminated', soundEnabled);
      } else {
        playSound('vote_citizen_eliminated', soundEnabled);
      }

      const updatedPlayers = players.map(p => p.id === eliminatedId ? { ...p, isAlive: false } : p);
      setPlayers(updatedPlayers);

      const win = checkWinConditions(updatedPlayers);
      if (win) {
        setWinnerTeam(win);
        if (win.team === 'mafia') playSound('win_mafia', soundEnabled);
        else playSound('win_town', soundEnabled);
      }
    } else {
      if (topTargets.length > 1) resultInfo.isTie = true;
      playSound('click', soundEnabled);
    }

    setVoteResultData(resultInfo);
    setGameState('DayVoteResult');
  };

  // --- CHECK WIN CONDITIONS ---
  const checkWinConditions = (currentPlayersList) => {
    const aliveList = currentPlayersList.filter(p => p.isAlive);
    const mafiaCount = aliveList.filter(p => isMafiaGroup(p.role)).length;
    const townCount = aliveList.filter(p => p.role !== 'TRAITOR' && !isMafiaGroup(p.role)).length;
    const traitorAlive = aliveList.some(p => p.role === 'TRAITOR');

    if (mafiaCount === 0) {
      return { team: 'town', title: 'فوز الأبرياء والصالحين! 🎉', desc: 'تم القضاء على جميع عناصر المافيا وإعادة الأمن للمدينة.' };
    }
    if (mafiaCount >= townCount + (traitorAlive ? 1 : 0)) {
      return { team: 'mafia', title: 'فوز المافيا بالسيطرة التامة! 💀', desc: 'أصبحت أعداد المافيا مساوية أو أكبر من المواطنين.' };
    }
    if (aliveList.length <= 2 && traitorAlive && mafiaCount === 0) {
      return { team: 'neutral', title: 'فوز الخاين التام! 🃏', desc: 'نجح الخاين بذكاء في التلاعب بالجميع والوصول للنهاية بمفرده.' };
    }

    return null;
  };

  const handleStartNextNight = () => {
    playSound('click', soundEnabled);
    if (winnerTeam) {
      setGameState('GameOver');
      return;
    }
    setCurrentTurnIndex(0);
    setGameState('NightPass');
    playSound('night', soundEnabled);
  };

  // ==================== RENDER SCREENS ====================

  const RenderSoundHeader = () => (
    <div className="w-full max-w-md mx-auto flex justify-end px-2 pt-2">
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
      >
        {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
      </button>
    </div>
  );

  // --- 1. SETUP SCREEN ---
  if (gameState === 'Setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-purple-900/40 border border-purple-500/30 rounded-2xl mb-3 shadow-lg shadow-purple-950/50">
              <Skull className="w-10 h-10 text-purple-400 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-rose-400">
              مافيا برو ماكس
            </h1>
            <p className="text-xs text-purple-300/70 mt-1 font-medium">تجربة التمرير السرية للعب الجماعي (Pass the Phone)</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
            <label className="block text-sm font-bold text-slate-200 mb-2">
              أسماء اللاعبين (لاعب واحد في كل سطر):
            </label>
            <textarea
              value={playerNamesInput}
              onChange={(e) => setPlayerNamesInput(e.target.value)}
              placeholder={"أحمد\nمحمد\nسارة\nعمر\nفاطمة\nخالد"}
              rows={7}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition dir-rtl resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">الحد الأدنى: 5 لاعبين لضمان متعة وتوازن الأدوار.</p>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <Sparkles className="w-5 h-5" />
            <span>توزيع الأدوار وبدء اللعبة</span>
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 2. INITIAL ROLE REVEAL SCREEN ---
  if (gameState === 'RoleReveal') {
    const player = players[currentTurnIndex];
    const role = ROLES_INFO[player.role];
    const RoleIcon = role.icon;
    const isHidden = permanentlyHidden[player.id];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-purple-400 tracking-wider uppercase px-3 py-1 bg-purple-950/60 border border-purple-800/40 rounded-full">
              مرحلة كشف الأدوار ({currentTurnIndex + 1} من {players.length})
            </span>
            <h2 className="text-2xl font-black mt-3 text-slate-100">سلم الموبايل في صمت شديد إلى:</h2>
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-white mt-1">
              [{player.name}]
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center">
            
            {!roleRevealed ? (
              <div className="py-8">
                <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
                <p className="text-sm text-slate-300 mb-6 font-medium">
                  تأكد أن لا أحد ينظر إلى الشاشة بجانبك قبل الفتح!
                </p>
                <button
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setRoleRevealed(true);
                  }}
                  disabled={isHidden}
                  className={`w-full py-4 font-bold rounded-2xl shadow-xl transition-all duration-200 ${
                    isHidden
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 active:scale-[0.98]'
                  }`}
                >
                  {isHidden ? 'تم كشف هذا الدور وسحبه نهائياً' : 'اضغط لكشف دورك السرّي 👁️'}
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${role.color} shadow-lg mb-1`}>
                  <RoleIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${role.badgeBg}`}>
                    {role.name}
                  </span>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    {role.description}
                  </p>
                </div>

                {isMafiaGroup(player.role) && (
                  <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-3 text-right">
                    <p className="text-xs font-bold text-red-400 flex items-center mb-2">
                      <Users className="w-4 h-4 inline ml-1" />
                      أعضاء فريق المافيا مع أسرارهم:
                    </p>
                    <div className="space-y-1">
                      {getMafiaTeammates().map(m => (
                        <div key={m.id} className="text-xs flex justify-between items-center text-slate-200 bg-slate-950/60 p-2 rounded-lg">
                          <span className="font-bold">{m.name} {m.id === player.id ? '(أنت)' : ''}</span>
                          <span className="text-red-300 font-mono text-[11px]">{ROLES_INFO[m.role].name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {player.role === 'TRAITOR' && (
                  <div className="bg-pink-950/40 border border-pink-900/50 rounded-2xl p-3 text-right">
                    <p className="text-xs font-bold text-pink-400 flex items-center mb-1">
                      <Sparkles className="w-4 h-4 inline ml-1" />
                      مهمتك السرية الخاصة:
                    </p>
                    <p className="text-xs text-pink-200 font-medium">{player.traitorMission}</p>
                  </div>
                )}

                <button
                  onClick={() => handleConfirmRoleSeen(player.id)}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl border border-slate-700 transition active:scale-[0.98] text-sm"
                >
                  فهمت دوري (إخفاء للأبد) 🔒
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 3. NIGHT PASS SCREEN ---
  if (gameState === 'NightPass') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-8 flex-1 flex flex-col justify-center text-center">
          
          <div className="inline-flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-3xl mb-6 shadow-2xl mx-auto">
            <Moon className="w-12 h-12 text-indigo-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold text-slate-400 mb-2">حل الليل على المدينة 🌙</h2>
          <p className="text-sm text-slate-300 mb-6">سلم الموبايل في صمت شديد وبدون أي إشارة إلى:</p>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-white">
              [{currentNightPlayer.name}]
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setGameState('NightAction');
            }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition"
          >
            أنا [{currentNightPlayer.name}] وجاهز 👍
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 4. NIGHT ACTION SCREEN (INSTANT ACTION & FAIR PLAY) ---
  if (gameState === 'NightAction') {
    const roleKey = currentNightPlayer.role;
    const validMafiaTargets = alivePlayers.filter(p => !isMafiaGroup(p.role));

    const mafiaAlive = isRoleAlive('MAFIA');
    const chemistAlive = isRoleAlive('CHEMIST');

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-full">
              دور الليل لـ: {currentNightPlayer.name}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            
            {/* MAFIA ACTION */}
            {roleKey === 'MAFIA' && (
              <div>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Skull className="w-6 h-6 text-red-500" />
                  <h3 className="font-bold text-red-400">اختر الضحية للقتل (الضغط ينفذ فوراً):</h3>
                </div>
                <div className="space-y-2">
                  {validMafiaTargets.map(target => (
                    <button
                      key={target.id}
                      onClick={() => handleNightActionAndAdvance('mafia', target.id)}
                      className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-red-500 hover:bg-red-950/30 text-right font-bold transition flex justify-between items-center"
                    >
                      <span>{target.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHEMIST ACTION */}
            {roleKey === 'CHEMIST' && (
              <div>
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Flame className="w-6 h-6 text-amber-500" />
                  <h3 className="font-bold text-amber-400">اختر شخصاً لتنويمه وتكتميه:</h3>
                </div>
                <div className="space-y-2">
                  {alivePlayers.map(target => (
                    <button
                      key={target.id}
                      onClick={() => handleNightActionAndAdvance('chemist', target.id)}
                      className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-amber-500 hover:bg-amber-950/30 text-right font-bold transition flex justify-between items-center"
                    >
                      <span>{target.name} {isMafiaGroup(target.role) ? '(مافيا)' : ''}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SPY INHERITANCE LOGIC */}
            {roleKey === 'SPY' && (
              <div>
                {!mafiaAlive && chemistAlive && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Skull className="w-6 h-6 text-red-500" />
                      <h3 className="font-bold text-red-400">الجاسوس (ورثت قوة المافيا، اختر الضحية):</h3>
                    </div>
                    <div className="space-y-2">
                      {validMafiaTargets.map(target => (
                        <button
                          key={target.id}
                          onClick={() => handleNightActionAndAdvance('mafia', target.id)}
                          className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-red-500 text-right font-bold transition flex justify-between"
                        >
                          <span>{target.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mafiaAlive && !chemistAlive && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Flame className="w-6 h-6 text-amber-500" />
                      <h3 className="font-bold text-amber-400">الجاسوس (ورثت قوة الكيميائي، اختر للتنويم):</h3>
                    </div>
                    <div className="space-y-2">
                      {alivePlayers.map(target => (
                        <button
                          key={target.id}
                          onClick={() => handleNightActionAndAdvance('chemist', target.id)}
                          className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-amber-500 text-right font-bold transition flex justify-between"
                        >
                          <span>{target.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!mafiaAlive && !chemistAlive && (
                  <div className="space-y-3">
                    <div className="bg-purple-950/50 border border-purple-800/60 p-3 rounded-2xl text-center">
                      <p className="text-xs text-purple-300 font-bold mb-2">اختر القدرة التي تود تنفيذها:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSpyChoice('mafia')}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${spyChoice === 'mafia' ? 'bg-red-900 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-red-300'}`}
                        >
                          قتل المافيا 💀
                        </button>
                        <button
                          onClick={() => setSpyChoice('chemist')}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${spyChoice === 'chemist' ? 'bg-amber-900 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-amber-300'}`}
                        >
                          تنويم الكيميائي 🧪
                        </button>
                      </div>
                    </div>

                    {spyChoice === 'mafia' && (
                      <div className="space-y-2">
                        {validMafiaTargets.map(target => (
                          <button
                            key={target.id}
                            onClick={() => handleNightActionAndAdvance('mafia', target.id)}
                            className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 text-right font-bold text-xs"
                          >
                            {target.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {spyChoice === 'chemist' && (
                      <div className="space-y-2">
                        {alivePlayers.map(target => (
                          <button
                            key={target.id}
                            onClick={() => handleNightActionAndAdvance('chemist', target.id)}
                            className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 text-right font-bold text-xs"
                          >
                            {target.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!spyChoice && (
                      <button
                        onClick={() => handleNightActionAndAdvance('none', null)}
                        className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs mt-2"
                      >
                        تمرير بدون أشن ➡️
                      </button>
                    )}
                  </div>
                )}

                {mafiaAlive && chemistAlive && (
                  <div className="py-6 text-center space-y-4">
                    <Eye className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-300">أنت الجاسوس في الأمان!</h3>
                    <button
                      onClick={() => handleNightActionAndAdvance('none', null)}
                      className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-lg mt-4"
                    >
                      إنهاء الدور والتمرير ➡️
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DOCTOR ACTION */}
            {roleKey === 'DOCTOR' && (
              <div>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-bold text-emerald-400">اختر شخصاً لحمايته (الضغط ينفذ فوراً):</h3>
                </div>
                <div className="space-y-2">
                  {alivePlayers.map(target => (
                    <button
                      key={target.id}
                      onClick={() => handleNightActionAndAdvance('doctor', target.id)}
                      className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-emerald-500 hover:bg-emerald-950/30 text-right font-bold transition flex justify-between items-center"
                    >
                      <span>{target.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SNIPER ACTION */}
            {roleKey === 'SNIPER' && (
              <div>
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <UserX className="w-6 h-6 text-cyan-500" />
                  <h3 className="font-bold text-cyan-400">القناص الصالح:</h3>
                </div>
                {!currentNightPlayer.hasSniperShot ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-red-400 mb-4">لقد استنفدت رصاصتك الوحيدة!</p>
                    <button
                      onClick={() => handleNightActionAndAdvance('none', null)}
                      className="w-full py-3 bg-slate-800 text-slate-200 font-bold rounded-xl"
                    >
                      تمرير الدور ➡️
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleNightActionAndAdvance('sniper', null)}
                      className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-400 text-right font-bold text-xs"
                    >
                      عدم إطلاق النار الليلة 🛑
                    </button>
                    {alivePlayers.filter(p => p.id !== currentNightPlayer.id).map(target => (
                      <button
                        key={target.id}
                        onClick={() => handleNightActionAndAdvance('sniper', target.id)}
                        className="w-full p-3 rounded-xl border bg-slate-950/50 border-slate-800 text-slate-300 hover:border-cyan-500 text-right font-bold text-xs transition flex justify-between"
                      >
                        <span>إطلاق النار على: {target.name} 🎯</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DUMMY PASS FOR OTHER ROLES */}
            {(roleKey === 'CITIZEN' || roleKey === 'TRAITOR' || roleKey === 'MAYOR') && (
              <div className="py-6 text-center space-y-4">
                <Moon className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-slate-300">ليس لديك حركة ليلية...</h3>
                <button
                  onClick={() => handleNightActionAndAdvance('none', null)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl shadow-lg transition"
                >
                  تمرير الدور في صمت ➡️
                </button>
              </div>
            )}

          </div>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 5. NIGHT SUMMARY ---
  if (gameState === 'NightSummary') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-2">
              <Sun className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '15s' }} />
            </div>
            <h2 className="text-2xl font-black text-amber-300">استيقظت المدينة! 🌅</h2>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative min-h-[220px] flex flex-col justify-between mb-6">
            <div className="text-sm leading-relaxed text-slate-200 font-medium whitespace-pre-line dir-rtl">
              {displayedStory}
            </div>
            {!storyFinished && (
              <button
                onClick={handleSkipStory}
                className="mt-4 text-xs text-purple-400 underline font-bold text-left block"
              >
                تخطي ⏩
              </button>
            )}
          </div>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setGameState('DayDiscussion');
            }}
            disabled={!storyFinished}
            className={`w-full py-4 font-bold rounded-2xl shadow-xl transition-all duration-200 ${
              storyFinished
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white hover:opacity-90 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            الانتقال للمناقشة الصباحية 🗣️
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 6. DAY DISCUSSION ---
  if (gameState === 'DayDiscussion') {
    const mutedPlayer = players.find(p => p.id === mutedPlayerId);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-100">المناقشة الصباحية ☀️</h2>
          </div>

          {mutedPlayer && (
            <div className="bg-amber-950/50 border border-amber-800/60 rounded-2xl p-4 mb-6 shadow-xl text-center">
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 font-bold text-xs rounded-full mb-2">
                🤐 شارة الصمت الكيميائية
              </span>
              <p className="text-sm font-extrabold text-amber-200">
                اللاعب [{mutedPlayer.name}] مسموم وممنوع من الكلام والتصويت اليوم!
              </p>
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-bold text-slate-300 mb-3">اللاعبون الأحياء حالياً:</h3>
            <div className="grid grid-cols-2 gap-2">
              {alivePlayers.map(p => (
                <div key={p.id} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{p.name}</span>
                  {p.id === mutedPlayerId && <span className="text-amber-400 font-bold">🤐 مسموم</span>}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartVotingPhase}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition"
          >
            الانتقال لغرفة التصويت السرية 🗳️
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 7. DAY VOTE ACTION SCREEN (INSTANT VOTE & FAIR PLAY) ---
  if (gameState === 'DayVoteAction') {
    const voter = alivePlayers[currentTurnIndex];
    const isMuted = voter.id === mutedPlayerId;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full">
              دور التصويت لـ: {voter.name}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            
            {voter.role === 'MAYOR' && !voter.isMayorRevealed && (
              <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-2xl text-center space-y-2">
                <p className="text-xs text-amber-300 font-bold">أنت العمدة! إظهار الشارة يضاعف صوتك بصوتين:</p>
                <button
                  onClick={() => handleToggleMayorBadge(voter.id)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  🏅 إظهار الشارة الرسمية
                </button>
              </div>
            )}

            {isMuted ? (
              <div className="py-8 text-center space-y-3">
                <span className="text-4xl">🤐</span>
                <h3 className="text-lg font-bold text-amber-400">أنت مسموم وممنوع من التصويت!</h3>
                <button
                  onClick={() => handleCastVoteAndAdvance(voter.id, 0)}
                  className="w-full py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl transition mt-4"
                >
                  تأكيد الامتناع الإجباري والمتابعة ➡️
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-slate-200 text-sm mb-3">اختر المتهم (الضغط ينفذ فوراً وينقل الدور):</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCastVoteAndAdvance(voter.id, 0)}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/60 text-slate-400 text-right font-bold text-xs"
                  >
                    الامتناع عن التصويت / عدم طرد أحد ⚪
                  </button>

                  {alivePlayers.filter(p => p.id !== voter.id).map(target => (
                    <button
                      key={target.id}
                      onClick={() => handleCastVoteAndAdvance(voter.id, target.id)}
                      className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-purple-500 text-slate-200 text-right font-bold transition flex justify-between items-center text-sm"
                    >
                      <span>{target.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 8. DAY VOTE RESULT SCREEN ---
  if (gameState === 'DayVoteResult' && voteResultData) {
    const { eliminatedPlayer, isTie, votesSummary } = voteResultData;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-purple-300">نتائج التصويت الصباحي 🏛️</h2>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {eliminatedPlayer ? (
              <div className="bg-red-950/50 border border-red-800/60 rounded-2xl p-4 text-center">
                <h3 className="text-xl font-black text-red-200">
                  تم إقصاء اللاعب: [{eliminatedPlayer.name}]
                </h3>
                <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">دوره الحقيقي للمدينة:</p>
                  <p className="text-sm font-bold text-purple-300 mt-0.5">
                    {getDisplayedRoleName(eliminatedPlayer.role)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-yellow-400">لم يتم طرد أحد 🤝</span>
              </div>
            )}

            <button
              onClick={handleStartNextNight}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold rounded-2xl shadow-xl transition"
            >
              حلول الليل والدخول في الجولة التالية 🌙
            </button>
          </div>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  // --- 9. GAME OVER SCREEN ---
  if (gameState === 'GameOver' && winnerTeam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 dir-rtl">
        <RenderSoundHeader />
        <div className="max-w-md mx-auto w-full pt-4 flex-1 flex flex-col justify-center text-center">
          
          <div className="inline-flex p-4 bg-purple-900/30 border border-purple-500/30 rounded-3xl mb-4 shadow-2xl mx-auto">
            <Award className="w-16 h-16 text-purple-400 animate-bounce" />
          </div>

          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-white mb-2">
            {winnerTeam.title}
          </h1>
          <p className="text-sm text-slate-300 mb-6 font-medium">{winnerTeam.desc}</p>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right space-y-3 mb-6">
            <h3 className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-800 pb-2">أدوار جميع اللاعبين باللعبة:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200">{p.name}</span>
                  <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${ROLES_INFO[p.role].badgeBg}`}>
                    {ROLES_INFO[p.role].name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setGameState('Setup');
              setPlayers([]);
              setWinnerTeam(null);
            }}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
            <span>لعب مباراة جديدة 🔄</span>
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-slate-500 font-semibold tracking-wider">
          Made by <span className="text-purple-400 font-bold">Boody</span>
        </footer>
      </div>
    );
  }

  return null;
}
