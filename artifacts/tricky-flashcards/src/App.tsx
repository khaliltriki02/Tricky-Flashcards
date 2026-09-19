import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eraser,
  Layers3,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  getGetCardQueryKey,
  getGetDeckQueryKey,
  getListCardsQueryKey,
  getListDecksQueryKey,
  useCreateCard,
  useCreateDeck,
  useDeleteCard,
  useDeleteDeck,
  useGetCard,
  useGetDeck,
  useListCards,
  useListDecks,
  useUpdateCard,
  useUpdateDeck,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();

type Deck = {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  updatedAt: string;
};

type Card = {
  id: number;
  deckId: number;
  frontText: string;
  backText: string;
  frontDrawing: string | null;
  backDrawing: string | null;
  position: number;
  updatedAt: string;
};

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="wordmark" data-testid="link-home">
          <span className="wordmark-mark"><Layers3 size={16} strokeWidth={2.4} /></span>
          <strong>tricky</strong>
        </Link>
        <span className="topbar-note">a small place to remember things</span>
        <Link href="/" className="topbar-link" data-testid="link-your-decks">
          <BookOpen size={15} />
          Your decks
        </Link>
      </header>
      {children}
    </div>
  );
}

function ToastNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 2800);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);
  return (
    <div className="toast-note" role="status" data-testid="status-toast">
      <Check size={15} />
      <span>{message}</span>
      <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dismiss message" data-testid="button-dismiss-toast">
        <X size={14} />
      </button>
    </div>
  );
}

function AppFooter() {
  return <p className="credit">Developed by Khalil Triki</p>;
}

function Home() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const decksQuery = useListDecks();
  const decks = useMemo(() => ((decksQuery.data ?? []) as Deck[]), [decksQuery.data]);
  const createDeck = useCreateDeck();
  const deleteDeck = useDeleteDeck();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const totalCards = decks.reduce((sum, deck) => sum + deck.cardCount, 0);

  const refreshDecks = () => queryClient.invalidateQueries({ queryKey: getListDecksQueryKey() });
  const submitDeck = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || createDeck.isPending) return;
    createDeck.mutate({ data: { name: name.trim(), description: description.trim() } }, {
      onSuccess: (deck) => {
        setName('');
        setDescription('');
        refreshDecks();
        setNotice('Deck tucked away.');
        setLocation(`/decks/${deck.id}`);
      },
    });
  };
  const removeDeck = (deck: Deck) => {
    if (!window.confirm(`Delete “${deck.name}” and its cards?`)) return;
    deleteDeck.mutate({ deckId: deck.id }, {
      onSuccess: () => {
        refreshDecks();
        setNotice('Deck removed.');
      },
    });
  };

  return (
    <main className="page-wrap">
      <section className="hero-row">
        <div>
          <span className="eyebrow">Personal revision / {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
          <h1 className="display-title">Make room for <em>remembering.</em></h1>
          <p className="lede">Keep the tricky bits close. Build a few small decks, then meet one card at a time without the noise.</p>
        </div>
        <div className="hero-metric" data-testid="metric-study-count">
          <b>{totalCards}</b>
          <span>cards waiting in {decks.length} {decks.length === 1 ? 'deck' : 'decks'}</span>
        </div>
      </section>

      <div className="workspace-grid">
        <section>
          <div className="section-label">
            <h2>Your little library</h2>
            <span>{decks.length ? 'Pick a thread to pull' : 'Start with one thought'}</span>
          </div>
          {decksQuery.isLoading ? (
            <div className="skeleton-grid" data-testid="loading-decks">
              <div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" />
            </div>
          ) : decksQuery.isError ? (
            <div className="error-box" data-testid="error-decks">
              We could not open your library just now.
              <button type="button" onClick={() => decksQuery.refetch()} data-testid="button-retry-decks">Try again</button>
            </div>
          ) : decks.length === 0 ? (
            <div className="empty-state" data-testid="empty-decks">
              <div>
                <div className="empty-mark"><Pencil size={21} /></div>
                <h3>Your first deck can be tiny.</h3>
                <p>One topic, a handful of honest questions, and somewhere calm to return to.</p>
              </div>
            </div>
          ) : (
            <div className="deck-grid" data-testid="list-decks">
              {decks.map((deck) => (
                <article className="deck-card" key={deck.id} data-testid={`card-deck-${deck.id}`}>
                  <div className="deck-card-top">
                    <Link href={`/decks/${deck.id}`} data-testid={`link-deck-${deck.id}`}>
                      <h3>{deck.name}</h3>
                    </Link>
                    <p>{deck.description || 'A quiet stack of questions.'}</p>
                  </div>
                  <div className="deck-card-bottom">
                    <span className="count-label">{deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}</span>
                    <div className="card-actions">
                      <button type="button" className="icon-button" onClick={() => setLocation(`/decks/${deck.id}?review=1`)} aria-label={`Review ${deck.name}`} data-testid={`button-review-${deck.id}`}>
                        <Play size={15} fill="currentColor" />
                      </button>
                      <button type="button" className="icon-button danger" onClick={() => removeDeck(deck)} aria-label={`Delete ${deck.name}`} data-testid={`button-delete-deck-${deck.id}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <form className="new-deck-panel" onSubmit={submitDeck} data-testid="form-create-deck">
          <h2>Start a new thread.</h2>
          <p>Name the thing you want to understand. You can make it more precise later.</p>
          <div className="form-stack">
            <label className="field-label" htmlFor="deck-name">Deck name
              <input id="deck-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Organic chemistry" required data-testid="input-deck-name" />
            </label>
            <label className="field-label" htmlFor="deck-description">A short note
              <textarea id="deck-description" className="text-area" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you trying to hold onto?" data-testid="input-deck-description" />
            </label>
            <button className="primary-button" type="submit" disabled={createDeck.isPending || !name.trim()} data-testid="button-create-deck">
              <CirclePlus size={16} />
              {createDeck.isPending ? 'Making space…' : 'Create deck'}
            </button>
          </div>
        </form>
      </div>
      <AppFooter />
      {notice && <ToastNote message={notice} onDismiss={() => setNotice('')} />}
    </main>
  );
}

function DrawingPad({ value, onChange, label, testId }: { value: string | null; onChange: (value: string | null) => void; label: string; testId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = value;
    }
  }, [value]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  };
  const startStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    drawing.current = true;
    hasStroke.current = true;
    canvas.setPointerCapture(event.pointerId);
    const start = point(event);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineWidth = tool === 'erase' ? 28 : 5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
    context.strokeStyle = '#4a3149';
  };
  const moveStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
  };
  const endStroke = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context && hasStroke.current) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const hasInk = pixels.some((_, index) => index % 4 === 3 && pixels[index] > 0);
      onChange(hasInk ? canvas.toDataURL('image/png') : null);
      hasStroke.current = hasInk;
      context.globalCompositeOperation = 'source-over';
    }
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    hasStroke.current = false;
    setTool('draw');
    onChange(null);
  };

  return (
    <div className="face-panel">
      <header>
        <span>{label} handwriting</span>
        <div className="draw-tools" role="toolbar" aria-label={`${label} handwriting tools`}>
          <button type="button" className={`icon-button draw-tool-button ${tool === 'draw' ? 'active' : ''}`} onClick={() => setTool('draw')} aria-label={`Draw on ${label} handwriting`} aria-pressed={tool === 'draw'} data-testid={`button-draw-${testId}`}>
            <Pencil size={14} />
          </button>
          <button type="button" className={`icon-button draw-tool-button ${tool === 'erase' ? 'active' : ''}`} onClick={() => setTool('erase')} aria-label={`Erase ${label} handwriting`} aria-pressed={tool === 'erase'} data-testid={`button-erase-${testId}`}>
            <Eraser size={14} />
          </button>
          <button type="button" className="icon-button" onClick={clear} aria-label={`Clear ${label} drawing`} data-testid={`button-clear-${testId}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </header>
      <div className={`draw-board ${tool === 'erase' ? 'erasing' : ''}`}>
        <canvas ref={canvasRef} width={900} height={480} onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={endStroke} onPointerCancel={endStroke} data-testid={`canvas-${testId}`} />
        <span className="draw-hint">{tool === 'erase' ? 'eraser active' : 'pointer / stylus'}</span>
      </div>
    </div>
  );
}

function HandwritingPreview({ src, alt }: { src: string; alt: string }) {
  const [croppedSrc, setCroppedSrc] = useState(src);

  useEffect(() => {
    let active = true;
    setCroppedSrc(src);
    const image = new Image();
    image.onload = () => {
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext('2d');
      if (!sourceContext) return;
      sourceContext.drawImage(image, 0, 0);

      const { data, width, height } = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 12) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < 0 || !active) return;
      const padding = Math.max(14, Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * 0.08));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropRight = Math.min(width, maxX + padding + 1);
      const cropBottom = Math.min(height, maxY + padding + 1);
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropRight - cropX;
      cropCanvas.height = cropBottom - cropY;
      const cropContext = cropCanvas.getContext('2d');
      if (!cropContext) return;
      cropContext.drawImage(sourceCanvas, cropX, cropY, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
      if (active) setCroppedSrc(cropCanvas.toDataURL('image/png'));
    };
    image.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  return <img className="drawing-preview" src={croppedSrc} alt={alt} />;
}

function shuffleCards(cards: Card[]) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function ReviewPanel({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewCards] = useState(() => shuffleCards(cards));
  const card = reviewCards[index];
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(reviewCards.length - 1, 0)));
  }, [reviewCards.length]);
  useEffect(() => {
    setFlipped(false);
  }, [card?.id]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setFlipped((current) => !current);
      }
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(reviewCards.length - 1, current + 1));
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewCards.length]);
  if (!card) {
    return <div className="empty-state" data-testid="empty-review"><div><div className="empty-mark"><BookOpen size={21} /></div><h3>Nothing to review yet.</h3><p>Add a card above, then come back here when you are ready.</p></div></div>;
  }
  const percent = ((index + 1) / reviewCards.length) * 100;
  return (
    <section className="review-shell" aria-label="Review session" data-testid="review-session">
      <div className="review-top"><span>Quiet review</span><span data-testid="text-review-count">{index + 1} / {reviewCards.length}</span></div>
      <div className="review-progress"><i style={{ width: `${percent}%` }} /></div>
      <div className="flip-stage">
        <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((current) => !current)} role="button" tabIndex={0} aria-label="Flip flashcard" data-testid={`review-card-${card.id}`}>
          <div className="flip-face front">
            <small>Question</small>
            <div className="flip-face-content">{card.frontText && <p>{card.frontText}</p>}{card.frontDrawing && <HandwritingPreview src={card.frontDrawing} alt="Front handwriting" />}</div>
            <small>Click or press space to turn over</small>
          </div>
          <div className="flip-face back">
            <small>Answer</small>
            <div className="flip-face-content">{card.backText && <p>{card.backText}</p>}{card.backDrawing && <HandwritingPreview src={card.backDrawing} alt="Back handwriting" />}</div>
            <small>Keep the ones that surprise you</small>
          </div>
        </div>
      </div>
      <div className="review-controls">
        <button type="button" className="secondary-button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} data-testid="button-review-previous"><ChevronLeft size={16} /> Previous</button>
        <span className="review-help">Space to flip · arrow keys to move</span>
        <button type="button" className="secondary-button" onClick={() => setIndex((current) => Math.min(cards.length - 1, current + 1))} disabled={index === cards.length - 1} data-testid="button-review-next">Next <ChevronRight size={16} /></button>
      </div>
    </section>
  );
}

function DeckPage() {
  const { deckId: deckIdParam } = useParams<{ deckId: string }>();
  const deckId = Number(deckIdParam);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const deckQuery = useGetDeck(deckId, { query: { enabled: Number.isFinite(deckId), queryKey: getGetDeckQueryKey(deckId) } });
  const cardsQuery = useListCards(deckId, { query: { enabled: Number.isFinite(deckId), queryKey: getListCardsQueryKey(deckId) } });
  const cards = useMemo(() => [...((cardsQuery.data ?? []) as Card[])].sort((a, b) => a.position - b.position), [cardsQuery.data]);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState(() => new URLSearchParams(window.location.search).get('review') === '1');
  const [reviewSession, setReviewSession] = useState(0);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontDrawing, setFrontDrawing] = useState<string | null>(null);
  const [backDrawing, setBackDrawing] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const updateDeck = useUpdateDeck();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const selectedCard = cards.find((card) => card.id === activeCardId);
  const cardDetailQuery = useGetCard(activeCardId ?? 0, { query: { enabled: Boolean(activeCardId), queryKey: getGetCardQueryKey(activeCardId ?? 0) } });
  const sourceCard = (cardDetailQuery.data as Card | undefined) ?? selectedCard;

  useEffect(() => {
    if (!deckQuery.data) return;
    const deck = deckQuery.data as Deck;
    setDeckName(deck.name);
    setDeckDescription(deck.description || '');
  }, [deckQuery.data]);
  useEffect(() => {
    if (!cards.length) {
      setActiveCardId(null);
    } else if (!activeCardId || !cards.some((card) => card.id === activeCardId)) {
      setActiveCardId(cards[0].id);
    }
  }, [cards, activeCardId]);
  useEffect(() => {
    if (!selectedCard) return;
    setFrontText(selectedCard.frontText);
    setBackText(selectedCard.backText);
    setFrontDrawing(selectedCard.frontDrawing);
    setBackDrawing(selectedCard.backDrawing);
  }, [selectedCard]);

  const invalidateDeck = () => {
    queryClient.invalidateQueries({ queryKey: getGetDeckQueryKey(deckId) });
    queryClient.invalidateQueries({ queryKey: getListDecksQueryKey() });
  };
  const saveDeck = () => {
    if (!deckName.trim() || updateDeck.isPending) return;
    updateDeck.mutate({ deckId, data: { name: deckName.trim(), description: deckDescription.trim() } }, {
      onSuccess: () => {
        invalidateDeck();
        setNotice('Deck details saved.');
      },
    });
  };
  const addCard = () => {
    if (createCard.isPending) return;
    createCard.mutate({ deckId, data: { frontText: '', backText: '', frontDrawing: null, backDrawing: null, position: cards.length } }, {
      onSuccess: (card) => {
        queryClient.invalidateQueries({ queryKey: getListCardsQueryKey(deckId) });
        invalidateDeck();
        setActiveCardId(card.id);
        setNotice('New card ready.');
      },
    });
  };
  const saveCard = () => {
    if (!selectedCard || updateCard.isPending) return;
    setSaveState('saving');
    updateCard.mutate({ cardId: selectedCard.id, data: { frontText, backText, frontDrawing, backDrawing, position: selectedCard.position } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCardsQueryKey(deckId) });
        queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(selectedCard.id) });
        invalidateDeck();
        setSaveState('saved');
        setNotice('Card saved.');
      },
      onError: () => setSaveState('saved'),
    });
  };
  const removeCard = () => {
    if (!selectedCard || !window.confirm('Delete this card?')) return;
    deleteCard.mutate({ cardId: selectedCard.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCardsQueryKey(deckId) });
        invalidateDeck();
        setNotice('Card removed.');
      },
    });
  };

  if (deckQuery.isLoading || cardsQuery.isLoading) {
    return <main className="page-wrap"><div className="skeleton skeleton-card" style={{ maxWidth: 680 }} data-testid="loading-deck" /></main>;
  }
  if (deckQuery.isError || cardsQuery.isError || !deckQuery.data) {
    return <main className="page-wrap"><div className="error-box" data-testid="error-deck">This deck is not available. <button type="button" onClick={() => { deckQuery.refetch(); cardsQuery.refetch(); }} data-testid="button-retry-deck">Try again</button></div></main>;
  }
  const deck = deckQuery.data as Deck;
  return (
    <main className="page-wrap">
      <Link href="/" className="back-link" data-testid="link-back-decks"><ArrowLeft size={15} /> All decks</Link>
      <div className="deck-head">
        <div>
          <span className="eyebrow">Deck / {cards.length} cards</span>
          <h1>{deck.name}</h1>
          <p>{deck.description || 'Give this stack a little context in the field below.'}</p>
        </div>
        <div className="deck-head-actions">
          <button type="button" className={reviewMode ? 'secondary-button' : 'primary-button'} onClick={() => {
            if (reviewMode) {
              setReviewMode(false);
            } else {
              setReviewSession((current) => current + 1);
              setReviewMode(true);
            }
          }} data-testid="button-toggle-review">
            {reviewMode ? <Pencil size={16} /> : <Play size={16} fill="currentColor" />}
            {reviewMode ? 'Edit deck' : 'Review deck'}
          </button>
          <button type="button" className="secondary-button" onClick={() => setLocation('/')} data-testid="button-close-deck"><X size={16} /> Close</button>
        </div>
      </div>

      {reviewMode ? <ReviewPanel key={reviewSession} cards={cards} /> : (
        <>
          <div className="deck-layout">
            <aside className="sidebar-panel">
              <div className="sidebar-panel-title"><span>Cards</span><span>{cards.length}</span></div>
              <div className="card-list">
                {cards.map((card, index) => (
                  <button type="button" className={`card-list-item ${activeCardId === card.id ? 'active' : ''}`} key={card.id} onClick={() => setActiveCardId(card.id)} data-testid={`button-select-card-${card.id}`}>
                    <span className="card-number">{index + 1}</span>
                    <span className="card-list-copy"><strong>{card.frontText}</strong><span>{card.backText}</span></span>
                  </button>
                ))}
                {!cards.length && <div className="empty-state" style={{ minHeight: 160, padding: '1rem' }}><div><BookOpen size={19} /><p>Add the first card to begin.</p></div></div>}
              </div>
              <button type="button" className="secondary-button" style={{ width: '100%', marginTop: '.65rem' }} onClick={addCard} disabled={createCard.isPending} data-testid="button-add-card"><CirclePlus size={15} /> Add card</button>
            </aside>

            <section className="editor-card" aria-label="Card editor">
              <div className="editor-toolbar">
                <h2>{selectedCard ? `Card ${cards.findIndex((card) => card.id === selectedCard.id) + 1}` : 'A new card'}</h2>
                <span className="save-state"><i className={`save-dot ${saveState === 'saving' ? 'saving' : ''}`} />{saveState === 'saving' ? 'Saving' : 'Saved'}</span>
              </div>
              {selectedCard ? (
                <>
                  <div className="side-by-side">
                    <div className="face-panel">
                      <header><span>Front / prompt</span><span>{frontText.length} chars</span></header>
                      <textarea className="text-area" value={frontText} onChange={(event) => setFrontText(event.target.value)} data-testid="input-front-text" />
                      <DrawingPad value={frontDrawing} onChange={setFrontDrawing} label="Front" testId="front" />
                    </div>
                    <div className="face-panel">
                      <header><span>Back / answer</span><span>{backText.length} chars</span></header>
                      <textarea className="text-area" value={backText} onChange={(event) => setBackText(event.target.value)} data-testid="input-back-text" />
                      <DrawingPad value={backDrawing} onChange={setBackDrawing} label="Back" testId="back" />
                    </div>
                  </div>
                  <div className="editor-footer">
                    <button type="button" className="icon-button danger" onClick={removeCard} aria-label="Delete card" data-testid="button-delete-card"><Trash2 size={16} /></button>
                    <span className="editor-footer-note">{sourceCard?.updatedAt ? `Last touched ${new Date(sourceCard.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Write, sketch, save.'}</span>
                    <button type="button" className="primary-button" onClick={saveCard} disabled={updateCard.isPending} data-testid="button-save-card"><Save size={15} /> {updateCard.isPending ? 'Saving…' : 'Save card'}</button>
                  </div>
                </>
              ) : (
                <div className="empty-state"><div><div className="empty-mark"><Pencil size={21} /></div><h3>Make the first prompt.</h3><p>Keep it specific. Your future self will thank you.</p><button type="button" className="primary-button" onClick={addCard} data-testid="button-add-first-card"><CirclePlus size={15} /> Add first card</button></div></div>
              )}
            </section>
          </div>
          <section className="editor-card" style={{ marginTop: '1.2rem' }}>
            <div className="editor-toolbar"><h2>Deck details</h2><span className="save-state"><RotateCcw size={13} /> Small edits are welcome</span></div>
            <div className="side-by-side">
              <label className="field-label" htmlFor="edit-deck-name">Name<input id="edit-deck-name" className="text-input" value={deckName} onChange={(event) => setDeckName(event.target.value)} data-testid="input-edit-deck-name" /></label>
              <label className="field-label" htmlFor="edit-deck-description">Description<textarea id="edit-deck-description" className="text-area" value={deckDescription} onChange={(event) => setDeckDescription(event.target.value)} data-testid="input-edit-deck-description" /></label>
            </div>
            <div className="editor-footer"><span className="editor-footer-note">A clear title makes a kind review session.</span><button type="button" className="primary-button" onClick={saveDeck} disabled={updateDeck.isPending || !deckName.trim()} data-testid="button-save-deck"><Save size={15} /> {updateDeck.isPending ? 'Saving…' : 'Save details'}</button></div>
          </section>
        </>
      )}
      <AppFooter />
      {notice && <ToastNote message={notice} onDismiss={() => setNotice('')} />}
    </main>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <AppShell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/decks/:deckId" component={DeckPage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;