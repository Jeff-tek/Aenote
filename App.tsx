
import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { Note, NoteType, Theme } from './types';
import { transcribeAudio, summarizeText } from './services/geminiService';
import { MicIcon, StopCircleIcon, FileTextIcon, BrushIcon, PlusIcon, Trash2Icon, BrainCircuitIcon, SunIcon, MoonIcon, ZapIcon } from './constants';

// --- LIBS CONTEXT ---
// Create a context to hold the dynamically loaded libraries.
const LibsContext = createContext<any>(null);


// --- INITIAL DATA ---
const initialNotes: Note[] = [
    {
        id: 'welcome',
        title: 'Welcome to AetherNotes',
        content: `
        <h1>Welcome to AetherNotes! 🧠</h1>
        <p>This is your personal knowledge system. Here's how to get started:</p>
        <ul>
            <li>Create new notes using the '+' button in the sidebar. You can create text, audio, or sketch notes.</li>
            <li>Link notes together by typing <strong>[[Note Title]]</strong> in a text note. For example, here is a link to the [[About Linking]] note.</li>
            <li>View your knowledge graph on the right panel. It updates in real-time!</li>
            <li>Try out the <strong>Zen Mode</strong> and different themes using the buttons in the header.</li>
        </ul>
        <p>Happy thinking!</p>
        `,
        type: NoteType.TEXT,
        links: ['about-linking'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'about-linking',
        title: 'About Linking',
        content: `
        <h2>Connecting Ideas</h2>
        <p>Bidirectional linking is a core feature. When you link to a note, like [[Welcome to AetherNotes]], a connection is formed. This helps you discover relationships between your thoughts.</p>
        <p>The graph on the right visualizes these connections, creating a map of your knowledge.</p>
        `,
        type: NoteType.TEXT,
        links: ['welcome'],
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
    }
];

// --- HELPER COMPONENTS ---

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
);

type HeaderProps = {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    zenMode: boolean;
    onZenModeToggle: () => void;
};
const Header = React.memo(({ theme, onThemeChange, zenMode, onZenModeToggle }: HeaderProps) => (
    <header className="flex items-center justify-between p-2 border-b border-[--border-color] bg-[--panel-color] flex-shrink-0">
        <div className="flex items-center gap-2">
            <BrainCircuitIcon className="h-7 w-7 text-[--primary-color]" />
            <h1 className="text-xl font-bold">AetherNotes</h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={onZenModeToggle} title="Zen Mode" className="p-2 rounded-md hover:bg-[--hover-color] transition-colors">
                <ZapIcon className={`h-5 w-5 ${zenMode ? 'text-[--primary-color]' : ''}`} />
            </button>
            <div className="flex items-center p-1 rounded-full bg-[--bg-color]">
                 <button onClick={() => onThemeChange('light')} className={`p-1.5 rounded-full ${theme === 'light' ? 'bg-[--hover-color]' : ''}`}>
                    <SunIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onThemeChange('dark')} className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-[--hover-color]' : ''}`}>
                    <MoonIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onThemeChange('zen')} className={`p-1.5 rounded-full ${theme === 'zen' ? 'bg-[--hover-color]' : ''}`}>
                    <ZapIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    </header>
));

type SidebarProps = {
    notes: Note[];
    activeNoteId: string | null;
    onSelectNote: (id: string) => void;
    onCreateNote: (type: NoteType) => void;
    onDeleteNote: (id: string) => void;
    isLoading: boolean;
};
const Sidebar = React.memo(({ notes, activeNoteId, onSelectNote, onCreateNote, onDeleteNote, isLoading }: SidebarProps) => {
    const [showNewNoteOptions, setShowNewNoteOptions] = useState(false);
    
    const handleCreate = (type: NoteType) => {
        onCreateNote(type);
        setShowNewNoteOptions(false);
    };

    const getNoteIcon = (type: NoteType) => {
        switch (type) {
            case NoteType.TEXT: return <FileTextIcon className="h-5 w-5 text-sky-400" />;
            case NoteType.AUDIO: return <MicIcon className="h-5 w-5 text-rose-400" />;
            case NoteType.SKETCH: return <BrushIcon className="h-5 w-5 text-amber-400" />;
            default: return <FileTextIcon className="h-5 w-5" />;
        }
    };

    return (
        <aside className="w-64 md:w-80 bg-[--panel-color] flex flex-col flex-shrink-0">
            <div className="p-2 flex-shrink-0 relative">
                <button 
                    onClick={() => setShowNewNoteOptions(!showNewNoteOptions)}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-[--primary-color] text-white font-semibold hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                >
                    <PlusIcon className="h-5 w-5" /> New Note
                </button>
                {showNewNoteOptions && (
                    <div className="absolute top-full left-2 right-2 mt-1 bg-[--bg-color] border border-[--border-color] rounded-md shadow-lg z-10 p-2 grid grid-cols-3 gap-2 animate-fade-in">
                        <button onClick={() => handleCreate(NoteType.TEXT)} title="Text Note" className="flex flex-col items-center p-2 rounded-md hover:bg-[--hover-color] transition-colors"><FileTextIcon className="h-6 w-6 text-sky-400 mb-1" /><span className="text-xs">Text</span></button>
                        <button onClick={() => handleCreate(NoteType.AUDIO)} title="Audio Note" className="flex flex-col items-center p-2 rounded-md hover:bg-[--hover-color] transition-colors"><MicIcon className="h-6 w-6 text-rose-400 mb-1" /><span className="text-xs">Audio</span></button>
                        <button onClick={() => handleCreate(NoteType.SKETCH)} title="Sketch Note" className="flex flex-col items-center p-2 rounded-md hover:bg-[--hover-color] transition-colors"><BrushIcon className="h-6 w-6 text-amber-400 mb-1" /><span className="text-xs">Sketch</span></button>
                    </div>
                )}
            </div>
            <nav className="flex-grow overflow-y-auto p-2">
                <ul>
                    {notes.slice().sort((a,b) => b.updatedAt - a.updatedAt).map(note => (
                        <li key={note.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onSelectNote(note.id); }}
                                className={`group flex items-center justify-between p-2 my-1 rounded-md transition-colors ${activeNoteId === note.id ? 'bg-[--hover-color]' : 'hover:bg-[--hover-color]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {getNoteIcon(note.type)}
                                    <span className="truncate w-40">{note.title}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                    className="p-1 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 transition-opacity"
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                </button>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
});


type EditorProps = { note: Note; onUpdate: (content: string, title: string) => void; onSummarize: () => void; isProcessing: boolean };
const TextEditor = ({ note, onUpdate, onSummarize, isProcessing }: EditorProps) => {
    const libs = useContext(LibsContext);
    const { useEditor, EditorContent, StarterKit } = libs;

    const editor = useEditor({
        extensions: [StarterKit],
        content: note.content,
        onUpdate: ({ editor }) => {
            const newTitle = editor.state.doc.firstChild?.textContent.trim() || 'Untitled';
            onUpdate(editor.getHTML(), newTitle);
        },
    });

    useEffect(() => {
        if (editor && !editor.isDestroyed && note.content !== editor.getHTML()) {
            editor.commands.setContent(note.content, false);
        }
    }, [note.id, note.content, editor]);
    
    if (!editor) return <div className="p-4 text-center">Loading Editor...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-2 border-b border-[--border-color] flex justify-end">
                <button
                    onClick={onSummarize}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:bg-gray-500"
                >
                    {isProcessing ? <Spinner /> : <ZapIcon className="h-4 w-4" />}
                    Summarize with AI
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                 <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
};

type SketchpadProps = { note: Note; onUpdate: (content: string) => void };
const Sketchpad = ({ note, onUpdate }: SketchpadProps) => {
    const libs = useContext(LibsContext);
    const { Stage, Layer, Line } = libs;

    const [lines, setLines] = useState<any[]>([]);
    const isDrawing = useRef(false);
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          setSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);


    useEffect(() => {
        if (note.content) {
            setLines([]);
        }
    }, [note.id]);

    const handleMouseDown = (e: any) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { tool: 'pen', points: [pos.x, pos.y] }]);
    };
    
    const handleMouseMove = (e: any) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        setLines(lines.slice());
    };
    
    const handleMouseUp = () => {
        isDrawing.current = false;
        if (stageRef.current) {
            const dataUrl = stageRef.current.toDataURL();
            onUpdate(dataUrl);
        }
    };
    
    return (
        <div ref={containerRef} className="h-full w-full bg-white flex flex-col relative">
            {note.content && !lines.length && (
                 <img src={note.content} className="absolute inset-0 w-full h-full object-contain" alt="Saved sketch" />
            )}
            <Stage
                width={size.width}
                height={size.height}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                ref={stageRef}
                className="flex-grow"
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke="#3A352F"
                            strokeWidth={3}
                            tension={0.5}
                            lineCap="round"
                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};


type AudioRecorderProps = { onUpdate: (content: string, title: string) => void; isProcessing: boolean; onProcessing: (isProcessing: boolean) => void };
const AudioRecorder = ({ onUpdate, isProcessing, onProcessing }: AudioRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Ready to record");
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'prompt' | 'denied'>('checking');

    useEffect(() => {
        const checkPermission = async () => {
            if (typeof navigator.permissions?.query !== 'function') {
                setPermissionStatus('prompt'); // Fallback for browsers without Permissions API
                setStatus("Ready to record");
                return;
            }
            try {
                const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setPermissionStatus(micPermission.state);
                if (micPermission.state !== 'denied') {
                    setStatus("Ready to record");
                }
                
                micPermission.onchange = () => {
                    setPermissionStatus(micPermission.state);
                };
            } catch (error) {
                console.error("Failed to query microphone permissions", error);
                setPermissionStatus('prompt'); // Assume we can prompt if query fails
                setStatus("Ready to record");
            }
        };
        checkPermission();
    }, []);
  
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };
        mediaRecorder.current.onstop = async () => {
          onProcessing(true);
          setStatus("Transcribing with Gemini...");
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const transcription = await transcribeAudio(base64String, 'audio/webm');
            const newTitle = `Audio Note - ${new Date().toLocaleString()}`;
            onUpdate(transcription, newTitle);
            setStatus(`Transcription complete!`);
            onProcessing(false);
            audioChunks.current = [];
          };
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.current.start();
        setIsRecording(true);
        setStatus("Recording...");
      } catch (err: any) {
        console.error("Error starting recording:", err);
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
             setStatus("No microphone found. Please connect a device.");
        } else if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
             // NotAllowedError is handled by the permission state change, so we only handle other errors
             setStatus("Could not start recording.");
        }
      }
    };
  
    const stopRecording = () => {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        setIsRecording(false);
        setStatus("Processing audio...");
      }
    };

    const renderMainContent = () => {
        if (permissionStatus === 'denied') {
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center justify-center h-32 w-32 rounded-full bg-amber-500/20">
                        <MicIcon className="h-16 w-16 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-amber-400">Microphone Access Denied</h3>
                        <p className="mt-2 text-gray-400 max-w-sm">
                            AetherNotes needs microphone access. Please enable it in your browser's site settings, then reload the page.
                        </p>
                    </div>
                </div>
            );
        }

        if (permissionStatus === 'checking') {
             return (
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center h-32 w-32 rounded-full bg-gray-600">
                        <Spinner />
                    </div>
                    <p className="text-lg text-gray-400">Checking permissions...</p>
                </div>
             );
        }

        // Granted or Prompt
        return (
            <div className="flex flex-col items-center gap-4">
                <p className="text-lg text-gray-400 h-6">
                    { isRecording ? "Recording..." : isProcessing ? status : (permissionStatus === 'prompt' ? "Click to grant microphone access" : "Ready to record")}
                </p>
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`relative flex items-center justify-center h-32 w-32 rounded-full transition-all duration-300
                        ${isRecording ? 'bg-red-500 shadow-xl shadow-red-500/30' : 'bg-sky-500 shadow-xl shadow-sky-500/30'}
                        ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : ''}
                    `}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    {isProcessing ? <Spinner /> : isRecording ? <StopCircleIcon className="h-16 w-16 text-white" /> : <MicIcon className="h-16 w-16 text-white" />}
                    {isRecording && <div className="absolute inset-0 rounded-full border-4 border-white animate-ping"></div>}
                </button>
            </div>
        );
    }
  
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 p-4 bg-[--panel-color]">
        <h2 className="text-2xl font-bold">Audio Note</h2>
        {renderMainContent()}
      </div>
    );
};


type GraphViewProps = { notes: Note[]; theme: Theme };
const GraphView = ({ notes, theme }: GraphViewProps) => {
    const mermaidRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generateGraphDefinition = () => {
            if (notes.length === 0) return 'graph TD;';

            const style = getComputedStyle(document.documentElement);
            const panelColor = style.getPropertyValue('--panel-color').trim() || '#1e293b';
            const borderColor = style.getPropertyValue('--border-color').trim() || '#334155';
            const textColor = style.getPropertyValue('--text-color').trim() || '#f1f5f9';

            let def = 'graph TD;\n';
            const nodeIds = new Set(notes.map(n => n.id));
            
            notes.forEach(note => {
                def += `  ${note.id}["${note.title.replace(/"/g, '#quot;')}"];\n`;
                if(note.links) {
                    note.links.forEach(linkId => {
                        if (nodeIds.has(linkId)) {
                            def += `  ${note.id} --> ${linkId};\n`;
                        }
                    });
                }
            });
             def += `
                classDef default fill:${panelColor},stroke:${borderColor},stroke-width:2px,color:${textColor};
                classDef textNode fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
                classDef audioNode fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#fff;
                classDef sketchNode fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
            `;

            notes.forEach(note => {
                const className = note.type === NoteType.TEXT ? 'textNode' : note.type === NoteType.AUDIO ? 'audioNode' : 'sketchNode';
                def += `  class ${note.id} ${className};\n`
            })
            return def;
        };

        const renderGraph = async () => {
            if (!mermaidRef.current || !(window as any).mermaid) {
                return;
            }
            try {
                mermaidRef.current.style.visibility = 'hidden';
                const graphDefinition = generateGraphDefinition();
                const { svg } = await (window as any).mermaid.render(`graphDiv-${Date.now()}`, graphDefinition);
                if (mermaidRef.current) {
                     mermaidRef.current.innerHTML = svg;
                     mermaidRef.current.style.visibility = 'visible';
                }
            } catch (e) {
                console.error('Mermaid rendering error:', e);
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = `<div class="text-amber-400 p-4">Error rendering graph.</div>`;
                    mermaidRef.current.style.visibility = 'visible';
                }
            }
        };
        
        const tryRender = (attemptsLeft = 10) => {
            if ((window as any).mermaid) {
                renderGraph();
            } else if (attemptsLeft > 0) {
                setTimeout(() => tryRender(attemptsLeft - 1), 300);
            } else {
                console.error("Mermaid.js failed to load.");
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = `<div class="text-red-500 p-4">Could not load knowledge graph library.</div>`;
                }
            }
        };

        tryRender();

    }, [notes, theme]);

    return (
        <aside className="w-80 md:w-96 bg-[--panel-color] p-4 overflow-auto hidden lg:block">
            <h2 className="text-lg font-semibold mb-4">Knowledge Graph</h2>
            <div ref={mermaidRef} id="mermaid-container" className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        </aside>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [activeNoteId, setActiveNoteId] = useState<string | null>('welcome');
    const [theme, setTheme] = useState<Theme>('dark');
    const [zenMode, setZenMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedLibs, setLoadedLibs] = useState<any>(null);

    useEffect(() => {
        const loadLibs = async () => {
            try {
                const tiptapReact = await import('https://esm.sh/@tiptap/react@2.4.0');
                const tiptapStarterKit = await import('https://esm.sh/@tiptap/starter-kit@2.4.0');
                const reactKonva = await import('https://esm.sh/react-konva@18.2.10');
                
                setLoadedLibs({
                    useEditor: tiptapReact.useEditor,
                    EditorContent: tiptapReact.EditorContent,
                    StarterKit: tiptapStarterKit.StarterKit,
                    Stage: reactKonva.Stage,
                    Layer: reactKonva.Layer,
                    Line: reactKonva.Line,
                });
            } catch (error) {
                console.error("Failed to load external libraries:", error);
                // Optionally set an error state to show a message to the user
            }
        };
        loadLibs();
    }, []);

    useEffect(() => {
        // Theme management
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'zen');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        // Mermaid.js initialization needs to be theme-aware
        if ((window as any).mermaid) {
            const style = getComputedStyle(document.documentElement);
            (window as any).mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                themeVariables: {
                    background: style.getPropertyValue('--panel-color').trim() || '#0f172a',
                    primaryColor: style.getPropertyValue('--panel-color').trim() || '#1e293b',
                    primaryTextColor: style.getPropertyValue('--text-color').trim() || '#f1f5f9',
                    lineColor: style.getPropertyValue('--border-color').trim() || '#334155',
                    fontSize: '14px',
                },
            });
        }
    }, [theme]);

    const parseLinks = (content: string): string[] => {
        const linkRegex = /\[\[(.*?)\]\]/g;
        const matches = [...content.matchAll(linkRegex)];
        return matches.map(match => {
            const targetTitle = match[1];
            const targetNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
            return targetNote ? targetNote.id : '';
        }).filter(id => id);
    };

    const handleCreateNote = (type: NoteType) => {
        const newId = `note-${Date.now()}`;
        const newNote: Note = {
            id: newId,
            title: `Untitled ${type.toLowerCase()} note`,
            content: type === NoteType.TEXT ? `<h1>Untitled ${type.toLowerCase()} note</h1><p>Start writing...</p>` : '',
            type,
            links: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setNotes(prev => [...prev, newNote]);
        setActiveNoteId(newId);
    };

    const handleDeleteNote = (id: string) => {
        setNotes(prev => {
            const remainingNotes = prev.filter(note => note.id !== id);
             if (activeNoteId === id) {
                setActiveNoteId(remainingNotes.length > 0 ? remainingNotes.sort((a,b) => b.updatedAt - a.updatedAt)[0].id : null);
            }
            return remainingNotes;
        });
    };
    
    const handleUpdateNote = useCallback((id: string, content: string, newTitle?: string) => {
        setNotes(prev => prev.map(note => {
            if (note.id === id) {
                const updatedNote = {
                    ...note,
                    content,
                    title: newTitle || note.title,
                    updatedAt: Date.now(),
                };
                if (note.type === NoteType.TEXT) {
                     updatedNote.links = parseLinks(content);
                }
                return updatedNote;
            }
            return note;
        }));
    }, [notes]); // Added notes dependency for parseLinks to have latest notes

    const handleSummarize = async () => {
        const activeNote = notes.find(n => n.id === activeNoteId);
        if (!activeNote || activeNote.type !== NoteType.TEXT) return;
        
        setIsLoading(true);
        const summary = await summarizeText(activeNote.content.replace(/<[^>]*>?/gm, ' '));
        const summaryHtml = `<blockquote><p><strong>AI Summary:</strong></p><p>${summary.replace(/\n/g, '<br>')}</p></blockquote>`;
        handleUpdateNote(activeNote.id, activeNote.content + summaryHtml, activeNote.title);
        setIsLoading(false);
    };
    
    if (!loadedLibs) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center bg-[--bg-color] text-[--text-color] ${theme}`}>
                <div className="flex flex-col items-center gap-4">
                    <BrainCircuitIcon className="h-16 w-16 text-[--primary-color] animate-pulse" />
                    <h1 className="text-2xl font-bold">Loading AetherNotes...</h1>
                </div>
            </div>
        );
    }

    const activeNote = notes.find(n => n.id === activeNoteId);

    return (
        <LibsContext.Provider value={loadedLibs}>
            <div className="h-screen w-screen bg-[--bg-color] text-[--text-color] flex flex-col transition-colors duration-300">
                <Header theme={theme} onThemeChange={setTheme} zenMode={zenMode} onZenModeToggle={() => setZenMode(!zenMode)} />
                <main className="flex-grow flex overflow-hidden">
                    {!zenMode && (
                        <Sidebar
                            notes={notes}
                            activeNoteId={activeNoteId}
                            onSelectNote={setActiveNoteId}
                            onCreateNote={handleCreateNote}
                            onDeleteNote={handleDeleteNote}
                            isLoading={isLoading}
                        />
                    )}
                    <section className="flex-grow flex flex-col bg-[--bg-color]">
                        {activeNote ? (
                            <>
                                {activeNote.type === NoteType.TEXT && <TextEditor note={activeNote} onUpdate={(content, title) => handleUpdateNote(activeNote.id, content, title)} onSummarize={handleSummarize} isProcessing={isLoading} />}
                                {activeNote.type === NoteType.SKETCH && <Sketchpad note={activeNote} onUpdate={(content) => handleUpdateNote(activeNote.id, content, `Sketch - ${new Date().toLocaleString()}`)} />}
                                {activeNote.type === NoteType.AUDIO && <AudioRecorder onUpdate={(content, title) => handleUpdateNote(activeNote.id, content, title)} isProcessing={isLoading} onProcessing={setIsLoading} />}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <BrainCircuitIcon className="h-24 w-24 text-gray-600 mb-4" />
                                <h2 className="text-2xl font-bold">Select a note or create a new one</h2>
                                <p className="text-gray-400">Your knowledge awaits.</p>
                            </div>
                        )}
                    </section>
                    {!zenMode && <GraphView notes={notes} theme={theme} />}
                </main>
            </div>
        </LibsContext.Provider>
    );
}
