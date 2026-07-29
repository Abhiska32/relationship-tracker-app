import { useState, useEffect, useMemo, useRef } from "react";
import {
  deleteCartItem,
  deleteMemory,
  deleteMilestone,
  loadCartItems,
  loadJourney,
  loadMemories,
  loadSettings,
  saveCartItem,
  saveMemory,
  saveMilestone,
  saveSettings,
} from "../firebase/firestore";
import {
  Heart,
  Music2,
  BookImage,
  Milestone,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  X,
  Settings,
  Trash2,
  List,
  ChevronLeft,
  Volume2,
  VolumeX,
  Camera,
  ChevronDown,
  Home,
  ExternalLink,
  ShoppingCart,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { motion } from "motion/react";

type Page = "home" | "music" | "memories" | "journey" | "cart";

interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
}

interface JourneyItem {
  id: string;
  date: string;
  title: string;
  description: string;
  emoji: string;
}

interface CartItem {
  id: string;
  imageUrl: string;
  name: string;
  category: string;
  description: string;
  urls: string[];
  createdAt: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
}

const SONGS: Song[] = [
  {
    id: "1",
    title: "Until I Found You",
    artist: "Stephen Sanchez",
    cover: "/Image/until.png",
    src: "/music/until i found you.mp3",
  },
  {
    id: "2",
    title: "A Thousand Years",
    artist: "Christina Perri",
    cover: "/Image/years.png",
    src: "/music/A Thousand Years.mp3",
  },
  {
    id: "3",
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    cover: "/Image/help.jpg",
    src: "/music/Can't Help Falling in Love.mp3",
  },
  {
    id: "4",
    title: "Dandelions",
    artist: "Ruth B.",
    cover: "/Image/dan.jpg",
    src: "/music/Dandelions.mp3",
  },
  {
    id: "5",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    cover: "/Image/smile.jpg",
    src: "/music/Die With A Smile.mp3",
  },
  {
    id: "6",
    title: "HER",
    artist: "JVKE",
    cover: "/Image/her.jpg",
    src: "/music/HER.mp3",
  },
  {
    id: "7",
    title: "I Think They Call This Love",
    artist: "Elliot James Reay",
    cover: "/Image/call.jpg",
    src: "/music/I Think They Call This Love.mp3",
  },
  {
    id: "8",
    title: "Just the Two of Us",
    artist: "Grover Washington Jr.",
    cover: "/Image/2ofus.jpg",
    src: "/music/Just the Two of Us.mp3",
  },
  {
    id: "9",
    title: "Line Without a Hook",
    artist: "Ricky Montgomery",
    cover: "/Image/hook.jpg",
    src: "/music/Line Without a Hook.mp3",
  },
];

function load<T>(key: string, def: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : def;
  } catch {
    return def;
  }
}

function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function daysUntilBirthday(bday: string): number {
  if (!bday) return 0;
  const today = new Date();
  const b = new Date(bday);
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next <= today) next.setFullYear(today.getFullYear() + 1);
  return daysBetween(today, next);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Could not read image"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [page, setPage] = useState<Page>("home");

  // Settings
  const [startDate, setStartDate] = useState(() => load("startDate", "2023-01-15"));
  const [partnerName, setPartnerName] = useState(() => load("partnerName", "My Love"));
  const [partnerBirthday, setPartnerBirthday] = useState(() => load("partnerBirthday", ""));
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Memories
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [viewMemory, setViewMemory] = useState<Memory | null>(null);
  const [newMemory, setNewMemory] = useState({ imageUrl: "", caption: "", date: "" });
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState("");
  const memoryFileRef = useRef<HTMLInputElement>(null);

  // Journey
  const [journey, setJourney] = useState<JourneyItem[]>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    date: "",
    title: "",
    description: "",
    emoji: "💕",
  });

  // Shopping cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddCartItem, setShowAddCartItem] = useState(false);
  const [showEditCartItem, setShowEditCartItem] = useState(false);
  const [newCartItem, setNewCartItem] = useState({
    imageUrl: "",
    name: "",
    category: "General",
    description: "",
    urls: "",
  });
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editedCartItem, setEditedCartItem] = useState({
    imageUrl: "",
    name: "",
    category: "General",
    description: "",
    urls: "",
  });
  const [isAddingCartItem, setIsAddingCartItem] = useState(false);
  const [isSavingEditedCartItem, setIsSavingEditedCartItem] = useState(false);
  const [cartError, setCartError] = useState("");
  const [editCartError, setEditCartError] = useState("");
  const cartFileRef = useRef<HTMLInputElement>(null);
  const cartEditFileRef = useRef<HTMLInputElement>(null);

  // Music
  const [songIndex, setSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await loadSettings();
        if (settings) {
          setPartnerName(settings.partnerName);
          setStartDate(settings.startDate);
          setPartnerBirthday(settings.partnerBirthday);
        }
      } catch {
        // Keep local settings if Firestore is unavailable.
      } finally {
        setSettingsLoaded(true);
      }
    }

    fetchSettings();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchMemories() {
      try {
        const loadedMemories = await loadMemories();
        if (isMounted) {
          setMemories(loadedMemories);
        }
      } catch (error) {
        console.error("[App] Could not load memories", error);
      }
    }

    fetchMemories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchJourney() {
      try {
        const loadedJourney = await loadJourney();
        if (isMounted) {
          setJourney(loadedJourney);
        }
      } catch (error) {
        console.error("[App] Could not load journey", error);
      }
    }

    fetchJourney();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchCartItems() {
      try {
        const loadedCartItems = await loadCartItems();
        if (isMounted) {
          setCartItems(loadedCartItems);
        }
      } catch (error) {
        console.error("[App] Could not load cart items", error);
      }
    }

    fetchCartItems();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist
  useEffect(() => { save("startDate", startDate); }, [startDate]);
  useEffect(() => { save("partnerName", partnerName); }, [partnerName]);
  useEffect(() => { save("partnerBirthday", partnerBirthday); }, [partnerBirthday]);
  useEffect(() => {
    if (!settingsLoaded || !settingsDirty) return;

    saveSettings({
      partnerName,
      startDate,
      partnerBirthday,
    }).catch(() => {});
  }, [
    settingsLoaded,
    settingsDirty,
    partnerName,
    startDate,
    partnerBirthday,
  ]);

  // Audio effects
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = SONGS[songIndex].src;
    a.load();
    setCurrentTime(0);
    if (isPlaying) a.play().catch(() => {});
  }, [songIndex]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const prevSong = () => setSongIndex((i) => (i - 1 + SONGS.length) % SONGS.length);
  const nextSong = () => setSongIndex((i) => (i + 1) % SONGS.length);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    setCurrentTime(a.currentTime);
  };

  const daysCount = daysBetween(new Date(startDate), new Date());
  const bdayDays = daysUntilBirthday(partnerBirthday);
  const progress = duration ? currentTime / duration : 0;

  const cartCategoryOptions = useMemo(() => {
    const options = new Set<string>([
      "General",
      "Clothes",
      "Cosmetics",
      "Health Care",
      "Accessories",
      "Gifts",
    ]);

    cartItems.forEach((item) => {
      const value = item.category?.trim();
      if (value) options.add(value);
    });

    if (newCartItem.category?.trim()) options.add(newCartItem.category.trim());
    if (editedCartItem.category?.trim()) options.add(editedCartItem.category.trim());

    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [cartItems, newCartItem.category, editedCartItem.category]);

  const addMemory = async () => {
    if (!newMemory.imageUrl || !newMemory.caption.trim()) return;
    const m: Memory = {
      id: Date.now().toString(),
      imageUrl: newMemory.imageUrl,
      caption: newMemory.caption.trim(),
      date: newMemory.date || new Date().toISOString().slice(0, 10),
    };

    setIsAddingMemory(true);
    setMemoryError("");
    try {
      await saveMemory(m);
      setMemories((prev) =>
        [m, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      );
      closeAddMemory();
    } catch (error) {
      console.error("[App] Could not save memory", error);
      setMemoryError("Could not save that memory. Try again.");
    } finally {
      setIsAddingMemory(false);
    }
  };

  const closeAddMemory = () => {
    setShowAddMemory(false);
    setNewMemory({ imageUrl: "", caption: "", date: "" });
    setMemoryError("");
    if (memoryFileRef.current) memoryFileRef.current.value = "";
  };

  const handleMemoryImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMemoryError("Please choose an image file.");
      return;
    }
    setMemoryError("");
    setIsAddingMemory(true);
    try {
      const dataUrl = await readImageFile(file);
      setNewMemory((p) => ({ ...p, imageUrl: dataUrl }));
    } catch {
      setMemoryError("Could not load that image. Try another file.");
    } finally {
      setIsAddingMemory(false);
    }
  };

  const parseCartUrls = (value: string) =>
    value
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);

  const getSuggestedCartCategory = () => {
    const existingCategory = cartItems
      .map((item) => item.category?.trim())
      .find((value) => Boolean(value) && value !== "General");

    return existingCategory || "General";
  };

  const openAddCartItem = () => {
    setNewCartItem((prev) => ({
      ...prev,
      imageUrl: "",
      name: "",
      category: getSuggestedCartCategory(),
      description: "",
      urls: "",
    }));
    setCartError("");
    setShowAddCartItem(true);
  };

  const closeAddCartItem = () => {
    setShowAddCartItem(false);
    setNewCartItem((prev) => ({
      ...prev,
      imageUrl: "",
      name: "",
      category: prev.category || getSuggestedCartCategory(),
      description: "",
      urls: "",
    }));
    setCartError("");
    if (cartFileRef.current) cartFileRef.current.value = "";
  };

  const openEditCartItem = (item: CartItem) => {
    setEditingCartItem(item);
    setEditedCartItem({
      imageUrl: item.imageUrl,
      name: item.name,
      category: item.category,
      description: item.description,
      urls: item.urls.join("\n"),
    });
    setEditCartError("");
    setShowEditCartItem(true);
  };

  const closeEditCartItem = () => {
    setShowEditCartItem(false);
    setEditingCartItem(null);
    setEditedCartItem({
      imageUrl: "",
      name: "",
      category: "General",
      description: "",
      urls: "",
    });
    setEditCartError("");
    if (cartEditFileRef.current) cartEditFileRef.current.value = "";
  };

  const handleCartImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCartError("Please choose an image file.");
      return;
    }
    setCartError("");
    setIsAddingCartItem(true);
    try {
      const dataUrl = await readImageFile(file);
      setNewCartItem((p) => ({ ...p, imageUrl: dataUrl }));
    } catch {
      setCartError("Could not load that image. Try another file.");
    } finally {
      setIsAddingCartItem(false);
    }
  };

  const handleCartEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditCartError("Please choose an image file.");
      return;
    }
    setEditCartError("");
    setIsSavingEditedCartItem(true);
    try {
      const dataUrl = await readImageFile(file);
      setEditedCartItem((p) => ({ ...p, imageUrl: dataUrl }));
    } catch {
      setEditCartError("Could not load that image. Try another file.");
    } finally {
      setIsSavingEditedCartItem(false);
    }
  };

  const addCartItem = async () => {
    if (!newCartItem.imageUrl || !newCartItem.name.trim()) return;
    const item: CartItem = {
      id: Date.now().toString(),
      imageUrl: newCartItem.imageUrl,
      name: newCartItem.name.trim(),
      category: newCartItem.category.trim() || "General",
      description: newCartItem.description.trim(),
      urls: parseCartUrls(newCartItem.urls),
      createdAt: new Date().toISOString(),
    };

    setIsAddingCartItem(true);
    setCartError("");
    try {
      await saveCartItem(item);
      setCartItems((prev) =>
        [item, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
      closeAddCartItem();
    } catch (error) {
      console.error("[App] Could not save cart item", error);
      setCartError("Could not save that item. Try again.");
    } finally {
      setIsAddingCartItem(false);
    }
  };

  const saveEditedCartItem = async () => {
    if (!editingCartItem || !editedCartItem.imageUrl || !editedCartItem.name.trim()) return;

    const updatedItem: CartItem = {
      ...editingCartItem,
      imageUrl: editedCartItem.imageUrl,
      name: editedCartItem.name.trim(),
      category: editedCartItem.category.trim() || "General",
      description: editedCartItem.description.trim(),
      urls: parseCartUrls(editedCartItem.urls),
    };

    setIsSavingEditedCartItem(true);
    setEditCartError("");
    try {
      await saveCartItem(updatedItem);
      setCartItems((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      closeEditCartItem();
    } catch (error) {
      console.error("[App] Could not update cart item", error);
      setEditCartError("Could not update that item. Try again.");
    } finally {
      setIsSavingEditedCartItem(false);
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title) return;
    const m: JourneyItem = {
      id: Date.now().toString(),
      date: newMilestone.date || new Date().toISOString().slice(0, 10),
      title: newMilestone.title,
      description: newMilestone.description,
      emoji: newMilestone.emoji || "💕",
    };

    try {
      await saveMilestone(m);
      setJourney((prev) =>
        [...prev, m].sort((a, b) => a.date.localeCompare(b.date))
      );
      setNewMilestone({ date: "", title: "", description: "", emoji: "💕" });
      setShowAddMilestone(false);
    } catch (error) {
      console.error("[App] Could not save milestone", error);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={nextSong}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Pages */}
      <div className="pb-24 min-h-screen">
        {page === "home" && (
          <HomePage
            daysCount={daysCount}
            partnerName={partnerName}
            bdayDays={bdayDays}
            partnerBirthday={partnerBirthday}
            onSettings={() => setShowSettings(true)}
          />
        )}
        {page === "music" && (
          <MusicPage
            song={SONGS[songIndex]}
            songIndex={songIndex}
            isPlaying={isPlaying}
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            muted={muted}
            showPlaylist={showPlaylist}
            onTogglePlay={togglePlay}
            onPrev={prevSong}
            onNext={nextSong}
            onSeek={handleSeek}
            onVolume={setVolume}
            onMute={() => setMuted((m) => !m)}
            onTogglePlaylist={() => setShowPlaylist((s) => !s)}
            onSelectSong={(i) => { setSongIndex(i); setShowPlaylist(false); }}
          />
        )}
        {page === "memories" && (
          <MemoriesPage
            memories={memories}
            onAdd={() => setShowAddMemory(true)}
            onView={setViewMemory}
            onDelete={async (id) => {
              try {
                await deleteMemory(id);
                setMemories((prev) => prev.filter((m) => m.id !== id));
              } catch (error) {
                console.error("[App] Could not delete memory", error);
              }
            }}
          />
        )}
        {page === "journey" && (
          <JourneyPage
            journey={journey}
            onAdd={() => setShowAddMilestone(true)}
            onDelete={async (id) => {
              try {
                await deleteMilestone(id);
                setJourney((prev) => prev.filter((m) => m.id !== id));
              } catch (error) {
                console.error("[App] Could not delete milestone", error);
              }
            }}
          />
        )}
        {page === "cart" && (
          <CartPage
            items={cartItems}
            onAdd={openAddCartItem}
            onEdit={openEditCartItem}
            onDelete={async (id) => {
              try {
                await deleteCartItem(id);
                setCartItems((prev) => prev.filter((item) => item.id !== id));
              } catch (error) {
                console.error("[App] Could not delete cart item", error);
              }
            }}
          />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex">
          {(
            [
              { id: "home", icon: Home, label: "Home" },
              { id: "music", icon: Music2, label: "Music" },
              { id: "memories", icon: BookImage, label: "Us" },
              { id: "journey", icon: Milestone, label: "Journey" },
              { id: "cart", icon: ShoppingCart, label: "Cart" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
                page === id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={page === id ? 2 : 1.5}
                fill={page === id && id === "home" ? "currentColor" : "none"}
              />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
              {page === id && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="Settings">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Name
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={partnerName}
                onChange={(e) => {
                  setSettingsDirty(true);
                  setPartnerName(e.target.value);
                }}
                placeholder="My Love"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Together since
              </span>
              <input
                type="date"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={startDate}
                onChange={(e) => {
                  setSettingsDirty(true);
                  setStartDate(e.target.value);
                }}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Birthday
              </span>
              <input
                type="date"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={partnerBirthday}
                onChange={(e) => {
                  setSettingsDirty(true);
                  setPartnerBirthday(e.target.value);
                }}
              />
            </label>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm mt-2 active:scale-95 transition-transform"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Add Memory Modal */}
      {showAddMemory && (
        <Modal onClose={closeAddMemory} title="Add a Memory">
          <div className="space-y-4">
            <input
              ref={memoryFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMemoryImageSelect}
            />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Photo
              </span>
              {newMemory.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={newMemory.imageUrl}
                    alt="Selected memory"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewMemory((p) => ({ ...p, imageUrl: "" }));
                      if (memoryFileRef.current) memoryFileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => memoryFileRef.current?.click()}
                  disabled={isAddingMemory}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/50 py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-60"
                >
                  <Camera size={28} className="text-primary" />
                  <span className="text-sm font-medium">
                    {isAddingMemory ? "Loading photo..." : "Choose a photo"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    From your gallery or camera
                  </span>
                </button>
              )}
            </label>
            {memoryError && (
              <p className="text-xs text-destructive">{memoryError}</p>
            )}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Caption
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newMemory.caption}
                onChange={(e) => setNewMemory((p) => ({ ...p, caption: e.target.value }))}
                placeholder="Our first date 🌹"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Date
              </span>
              <input
                type="date"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newMemory.date}
                onChange={(e) => setNewMemory((p) => ({ ...p, date: e.target.value }))}
              />
            </label>
            <button
              onClick={addMemory}
              disabled={!newMemory.imageUrl || !newMemory.caption.trim() || isAddingMemory}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              Add Memory
            </button>
          </div>
        </Modal>
      )}

      {/* View Memory Modal */}
      {viewMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setViewMemory(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 z-10"
            onClick={() => setViewMemory(null)}
          >
            <X size={28} />
          </button>
          <img
            src={viewMemory.imageUrl}
            alt={viewMemory.caption}
            className="w-full flex-1 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="p-6 text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="text-lg font-medium leading-snug mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {viewMemory.caption}
            </p>
            <p className="text-sm text-white/60">{formatDate(viewMemory.date)}</p>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <Modal onClose={() => setShowAddMilestone(false)} title="Add a Milestone">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Emoji
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newMilestone.emoji}
                onChange={(e) => setNewMilestone((p) => ({ ...p, emoji: e.target.value }))}
                placeholder="💕"
                maxLength={4}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Title
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone((p) => ({ ...p, title: e.target.value }))}
                placeholder="First road trip"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Story
              </span>
              <textarea
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                rows={3}
                value={newMilestone.description}
                onChange={(e) =>
                  setNewMilestone((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Write about this moment..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Date
              </span>
              <input
                type="date"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone((p) => ({ ...p, date: e.target.value }))}
              />
            </label>
            <button
              onClick={addMilestone}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform"
            >
              Add to Journey
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Cart Item Modal */}
      {showEditCartItem && editingCartItem && (
        <Modal onClose={closeEditCartItem} title="Edit Item">
          <div className="space-y-4">
            <input
              ref={cartEditFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCartEditImageSelect}
            />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Image
              </span>
              {editedCartItem.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={editedCartItem.imageUrl}
                    alt="Edited cart item"
                    className="w-full aspect-[4/3] object-contain bg-background/70 p-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditedCartItem((p) => ({ ...p, imageUrl: "" }));
                      if (cartEditFileRef.current) cartEditFileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => cartEditFileRef.current?.click()}
                  disabled={isSavingEditedCartItem}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/50 py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-60"
                >
                  <Camera size={28} className="text-primary" />
                  <span className="text-sm font-medium">
                    {isSavingEditedCartItem ? "Loading image..." : "Choose an image"}
                  </span>
                </button>
              )}
            </label>
            {editCartError && (
              <p className="text-xs text-destructive">{editCartError}</p>
            )}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Name
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={editedCartItem.name}
                onChange={(e) => setEditedCartItem((p) => ({ ...p, name: e.target.value }))}
                placeholder="Gift idea"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Category
              </span>
              <input
                list="cart-edit-category-options"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={editedCartItem.category}
                onChange={(e) =>
                  setEditedCartItem((p) => ({ ...p, category: e.target.value }))
                }
              />
              <datalist id="cart-edit-category-options">
                {cartCategoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Description
              </span>
              <textarea
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                rows={3}
                value={editedCartItem.description}
                onChange={(e) =>
                  setEditedCartItem((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Why this belongs here..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                URLs
              </span>
              <textarea
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                rows={3}
                value={editedCartItem.urls}
                onChange={(e) => setEditedCartItem((p) => ({ ...p, urls: e.target.value }))}
                placeholder="Paste one link per line"
              />
            </label>
            <button
              onClick={saveEditedCartItem}
              disabled={!editedCartItem.imageUrl || !editedCartItem.name.trim() || isSavingEditedCartItem}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* Add Cart Item Modal */}
      {showAddCartItem && (
        <Modal onClose={closeAddCartItem} title="Add to Cart">
          <div className="space-y-4">
            <input
              ref={cartFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCartImageSelect}
            />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Image
              </span>
              {newCartItem.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={newCartItem.imageUrl}
                    alt="Selected cart item"
                    className="w-full aspect-[4/3] object-contain bg-background/70 p-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewCartItem((p) => ({ ...p, imageUrl: "" }));
                      if (cartFileRef.current) cartFileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => cartFileRef.current?.click()}
                  disabled={isAddingCartItem}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/50 py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-60"
                >
                  <Camera size={28} className="text-primary" />
                  <span className="text-sm font-medium">
                    {isAddingCartItem ? "Loading image..." : "Choose an image"}
                  </span>
                </button>
              )}
            </label>
            {cartError && (
              <p className="text-xs text-destructive">{cartError}</p>
            )}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Name
              </span>
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newCartItem.name}
                onChange={(e) => setNewCartItem((p) => ({ ...p, name: e.target.value }))}
                placeholder="Gift idea"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Category
              </span>
              <input
                list="cart-category-options"
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                value={newCartItem.category}
                onChange={(e) =>
                  setNewCartItem((p) => ({ ...p, category: e.target.value }))
                }
              />
              <datalist id="cart-category-options">
                {cartCategoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Description
              </span>
              <textarea
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                rows={3}
                value={newCartItem.description}
                onChange={(e) =>
                  setNewCartItem((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Why this belongs here..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">
                URLs
              </span>
              <textarea
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                rows={3}
                value={newCartItem.urls}
                onChange={(e) => setNewCartItem((p) => ({ ...p, urls: e.target.value }))}
                placeholder="Paste one link per line"
              />
            </label>
            <button
              onClick={addCartItem}
              disabled={!newCartItem.imageUrl || !newCartItem.name.trim() || isAddingCartItem}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              Add to Cart
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-t-3xl p-6 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-semibold text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({
  daysCount,
  partnerName,
  bdayDays,
  partnerBirthday,
  onSettings,
}: {
  daysCount: number;
  partnerName: string;
  bdayDays: number;
  partnerBirthday: string;
  onSettings: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            For
          </p>
          <h1
            className="text-2xl text-foreground leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {partnerName}
          </h1>
        </div>
        <button
          onClick={onSettings}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Days counter hero */}
      <div className="mx-6 mt-4 rounded-3xl overflow-hidden relative bg-primary shadow-lg">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #fff 0%, transparent 60%)",
          }}
        />
        <div className="relative px-8 pt-10 pb-10 text-center">
          <Heart
            size={28}
            className="mx-auto mb-4 text-primary-foreground/70"
            fill="currentColor"
          />
          <p className="text-primary-foreground/70 text-sm font-medium tracking-widest uppercase mb-2">
            Days Together
          </p>
          <div
            className="text-8xl font-bold text-primary-foreground leading-none mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {daysCount}
          </div>
          <p className="text-primary-foreground/60 text-sm">
            days of loving you
          </p>
        </div>
      </div>

      {/* Birthday countdown */}
      <div className="mx-6 mt-4">
        {partnerBirthday ? (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                🎂
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-0.5">
                  Birthday Countdown
                </p>
                <p
                  className="text-foreground font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {bdayDays === 0
                    ? "Today is Love's birthday! 🎉"
                    : bdayDays === 1
                    ? "Tomorrow is Love's birthday!"
                    : `${bdayDays} days until Love's birthday`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onSettings}
            className="w-full bg-card rounded-2xl p-5 border border-dashed border-border flex items-center gap-3 text-left"
          >
            <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-xl">
              🎂
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Set birthday</p>
              <p className="text-xs text-muted-foreground/60">
                Tap to open settings
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Quote */}
      <div className="mx-6 mt-4 flex-1">
        <div className="bg-secondary/40 rounded-2xl p-5 border border-secondary">
          <p
            className="text-foreground/80 text-base leading-relaxed italic text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "I thought I was going to be a good boyfriend. But I've realized I'm overly protective and possessive. I want you all to myself because I'm terrified of losing you. I can't stand the thought of you looking at or admiring other guys besides me."
          </p>
          
        </div>
      </div>

      {/* Floating hearts decoration */}
      <div className="mx-6 mt-4 mb-2 flex justify-center gap-3 opacity-30">
        {["♡", "♡", "♡"].map((h, i) => (
          <span key={i} className="text-primary text-xl">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Music Page ───────────────────────────────────────────────────────────────
function MusicPage({
  song,
  songIndex,
  isPlaying,
  progress,
  currentTime,
  duration,
  volume,
  muted,
  showPlaylist,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onMute,
  onTogglePlaylist,
  onSelectSong,
}: {
  song: Song;
  songIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  showPlaylist: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolume: (v: number) => void;
  onMute: () => void;
  onTogglePlaylist: () => void;
  onSelectSong: (i: number) => void;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <h1
          className="text-2xl text-foreground"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Our Songs
        </h1>
        <button
          onClick={onTogglePlaylist}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
        >
          <List size={18} />
        </button>
      </div>

      {showPlaylist ? (
        /* Playlist view */
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-2">
            {SONGS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onSelectSong(i)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                  i === songIndex
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-card border border-border"
                }`}
              >
                <img
                  src={s.cover}
                  alt={s.title}
                  className="w-12 h-12 rounded-xl object-cover bg-muted"
                />
                <div className="flex-1 text-left">
                  <p
                    className={`font-medium text-sm ${
                      i === songIndex ? "text-primary" : "text-foreground"
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.artist}</p>
                </div>
                {i === songIndex && isPlaying && (
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3].map((b) => (
                      <div
                        key={b}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${40 + b * 20}%`,
                          animationDelay: `${b * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Player view */
        <div className="flex-1 flex flex-col px-6">
          {/* Album art */}
          <motion.div
            key={song.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mt-2 mb-8"
          >
            <div className="w-64 h-64 mx-auto rounded-3xl overflow-hidden shadow-2xl bg-muted">
              <img
                src={song.cover}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Song info */}
          <div className="text-center mb-6">
            <h2
              className="text-2xl font-semibold text-foreground mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {song.title}
            </h2>
            <p className="text-muted-foreground text-sm">{song.artist}</p>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div
              className="h-1.5 bg-muted rounded-full cursor-pointer"
              onClick={onSeek}
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <button
              onClick={onPrev}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button onClick={onMute} className="text-muted-foreground">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Memories Page ────────────────────────────────────────────────────────────
function MemoriesPage({
  memories,
  onAdd,
  onView,
  onDelete,
}: {
  memories: Memory[];
  onAdd: () => void;
  onView: (m: Memory) => void;
  onDelete: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const sortedMemories = useMemo(
    () =>
      [...memories].sort((a, b) =>
        sortDirection === "asc"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)
      ),
    [memories, sortDirection]
  );

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 pt-12 pb-3">
        <div>
          <h1
            className="text-2xl text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Pages of Us
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {memories.length} memories
          </p>
        </div>
        <button
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {memories.length > 0 && (
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <div className="flex rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("gallery")}
              className={`h-8 w-10 rounded-full flex items-center justify-center transition-colors ${
                viewMode === "gallery"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
              aria-label="Gallery view"
            >
              <BookImage size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-8 w-10 rounded-full flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortDirection((d) => (d === "desc" ? "asc" : "desc"))}
            className="h-9 rounded-full bg-muted px-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            {sortDirection === "desc" ? "Newest" : "Oldest"}
            {sortDirection === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      )}

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-4">
            📷
          </div>
          <p
            className="text-lg text-foreground/70 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            No memories yet
          </p>
          <p className="text-sm text-muted-foreground">
            Tap + to add a photo from your gallery
          </p>
        </div>
      ) : viewMode === "gallery" ? (
        <div className="px-4 grid grid-cols-3 gap-2">
          {sortedMemories.map((m) => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden bg-muted shadow-sm">
              <button onClick={() => onView(m)} className="w-full block text-left">
                <img
                  src={m.imageUrl}
                  alt={m.caption}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&auto=format";
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                  <p className="text-white text-[11px] leading-tight line-clamp-2">
                    {m.caption}
                  </p>
                  <p className="text-white/70 text-[9px] mt-0.5">
                    {formatDate(m.date)}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(m.id);
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center shadow-md"
                aria-label={`Delete memory ${m.caption}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {sortedMemories.map((m) => (
            <div key={m.id} className="bg-card rounded-2xl border border-border p-2 flex gap-3 shadow-sm">
              <button
                onClick={() => onView(m)}
                className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0"
              >
                <img
                  src={m.imageUrl}
                  alt={m.caption}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=160&h=160&fit=crop&auto=format";
                  }}
                />
              </button>
              <button
                onClick={() => onView(m)}
                className="flex-1 min-w-0 text-left py-1"
              >
                <p
                  className="text-sm text-foreground leading-snug break-words"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {m.caption}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDate(m.date)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(m.id)}
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive flex items-center justify-center flex-shrink-0"
                aria-label={`Delete memory ${m.caption}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────
function CartPage({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: CartItem[];
  onAdd: () => void;
  onEdit: (item: CartItem) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getHref = (url: string) =>
    /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const getCategory = (category: string) => category.trim() || "General";
  const getUrlLabel = (url: string) => {
    try {
      const parsed = new URL(getHref(url));
      return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    } catch {
      return url;
    }
  };
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(items.map((item) => getCategory(item.category)))).sort((a, b) =>
        a.localeCompare(b)
      ),
    ],
    [items]
  );
  const visibleItems = useMemo(
    () =>
      selectedCategory === "All"
        ? items
        : items.filter((item) => getCategory(item.category) === selectedCategory),
    [items, selectedCategory]
  );

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <div>
          <h1
            className="text-2xl text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Shopping Cart
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visibleItems.length} of {items.length} items
          </p>
        </div>
        <button
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-4">
            🛒
          </div>
          <p
            className="text-lg text-foreground/70 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nothing in the cart yet
          </p>
          <p className="text-sm text-muted-foreground">
            Tap + to add an image, name, and links
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div className="py-16 text-center">
              <p
                className="text-lg text-foreground/70 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No items here yet
              </p>
              <p className="text-sm text-muted-foreground">
                Add something to {selectedCategory}
              </p>
            </div>
          ) : visibleItems.map((item) => {
            const isExpanded = expanded[item.id] ?? false;
            const category = getCategory(item.category);
            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-contain bg-muted p-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-base font-semibold text-foreground leading-snug break-words"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="text-muted-foreground hover:text-primary"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {category}
                    </p>

                    {item.description && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [item.id]: !isExpanded,
                          }))
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        {isExpanded ? "Hide description" : "Show description"}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}

                    {isExpanded && item.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2 break-words">
                        {item.description}
                      </p>
                    )}

                    {item.urls.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {item.urls.map((url) => (
                          <a
                            key={url}
                            href={getHref(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary min-w-0"
                            title={url}
                          >
                            <ExternalLink size={13} className="flex-shrink-0" />
                            <span className="truncate">{getUrlLabel(url)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Journey Page ─────────────────────────────────────────────────────────────
function JourneyPage({
  journey,
  onAdd,
  onDelete,
}: {
  journey: JourneyItem[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 pt-12 pb-6">
        <div>
          <h1
            className="text-2xl text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Our Journey
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every chapter of us
          </p>
        </div>
        <button
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="px-6">
        {journey.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <p
              className="text-lg text-foreground/70"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your story starts here
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {journey.map((item, idx) => (
                <div key={item.id} className="relative pl-16 group">
                  {/* Dot */}
                  <div className="absolute left-4 top-4 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs leading-none">
                    <span style={{ fontSize: 11 }}>{item.emoji}</span>
                  </div>

                  <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-1">
                          {formatDate(item.date)}
                        </p>
                        <h3
                          className="text-base font-semibold text-foreground leading-snug mb-1"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* End dot */}
              <div className="relative pl-16">
                <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Heart size={10} fill="white" stroke="white" />
                </div>
                <p
                  className="text-sm text-primary italic pt-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  ...and the story continues
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
}
