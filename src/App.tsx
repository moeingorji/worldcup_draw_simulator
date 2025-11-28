import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  DrawState,
  Group,
  GroupId,
  Team,
  GROUP_PATHWAY,
  drawNextTeamSafe,
  solveCurrentPot,
  reSolveCurrentPotAssignments,
  solveAllPots,
  getValidGroupsForTeam,
  initDrawState,
} from "../draw";
import teams from "../teams";
import { getFlagSources } from "./flagUtils";

const GROUP_ORDER: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const SPOTLIGHT_MS = 3200;

type Language = "en" | "fa";
const translations: Record<Language, Record<string, string>> = {
  en: {
    title: "World Cup 2026 Draw",
    currentPot: "Current pot",
    controls: "Controls",
    drawNext: "Draw next",
    autoDraw: "Auto-draw",
    autoStep: "Auto step",
    reset: "Reset",
    shareExport: "Share / Export",
    capture: "Capture draw image",
    download: "Download image",
    copy: "Copy image to clipboard",
    shareX: "Share on X",
    status: "Status",
    teamsDrawn: "Teams drawn",
    drawComplete: "Draw complete ✅",
    groupsTitle: "2026 FIFA World Cup group stage",
    empty: "Empty",
    current: "Current",
    left: "left",
  },
  fa: {
    title: "قرعه‌کشی جام جهانی ۲۰۲۶",
    currentPot: "گلدان فعلی",
    controls: "کنترل‌ها",
    drawNext: "قرعه بعدی",
    autoDraw: "قرعه‌کشی خودکار",
    autoStep: "قرعه خودکار مرحله‌ای",
    reset: "بازنشانی",
    shareExport: "اشتراک / خروجی",
    capture: "گرفتن تصویر قرعه",
    download: "دانلود تصویر",
    copy: "کپی تصویر در کلیپ‌بورد",
    shareX: "اشتراک در X",
    status: "وضعیت",
    teamsDrawn: "تیم‌های قرعه شده",
    drawComplete: "قرعه کامل شد ✅",
    groupsTitle: "مرحله گروهی جام جهانی ۲۰۲۶",
    empty: "خالی",
    current: "فعلی",
    left: "باقی مانده",
  },
};

const useText = (lang: Language) => (key: string) => translations[lang][key] ?? key;

const CONFED_DOT: Record<string, string> = {
  UEFA: "bg-blue-500",
  CONMEBOL: "bg-orange-500",
  CONCACAF: "bg-yellow-500",
  CAF: "bg-green-500",
  AFC: "bg-red-500",
  OFC: "bg-sky-500",
};

const isDrawComplete = (state: DrawState): boolean =>
  Object.values(state.pots).every((pot) => pot.length === 0);

const getPreviewValidGroups = (state: DrawState): GroupId[] => {
  const potTeams = state.pots[state.currentPot];
  const nextTeam = potTeams[0];
  if (!nextTeam) return [];
  return getValidGroupsForTeam(state, nextTeam);
};

const FlagIcon = ({ team, size = 24 }: { team: Team; size?: number }) => {
  const sources = getFlagSources(team);
  return (
    <div className="flex items-center gap-1">
      {sources.map((src, idx) => (
        <img
          key={`${team.id}-${idx}`}
          src={src}
          alt={`${team.name} flag`}
          className="block h-6 w-8 rounded border border-slate-200 object-cover"
          crossOrigin="anonymous"
          style={{ width: size + 6, height: size }}
        />
      ))}
    </div>
  );
};

const ConfedDot = ({ team }: { team: Team }) => {
  const cls = team.confed ? CONFED_DOT[team.confed] : "bg-slate-300";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
};

const TEAM_NAMES_FA: Record<string, string> = {
  usa: "ایالات متحده",
  mexico: "مکزیک",
  canada: "کانادا",
  spain: "اسپانیا",
  argentina: "آرژانتین",
  france: "فرانسه",
  england: "انگلیس",
  brazil: "برزیل",
  portugal: "پرتغال",
  netherlands: "هلند",
  belgium: "بلژیک",
  germany: "آلمان",
  croatia: "کرواسی",
  morocco: "مراکش",
  colombia: "کلمبیا",
  uruguay: "اروگوئه",
  switzerland: "سوئیس",
  japan: "ژاپن",
  senegal: "سنگال",
  iran: "ایران",
  "south-korea": "کره جنوبی",
  ecuador: "اکوادور",
  austria: "اتریش",
  australia: "استرالیا",
  norway: "نروژ",
  panama: "پاناما",
  egypt: "مصر",
  algeria: "الجزایر",
  scotland: "اسکاتلند",
  paraguay: "پاراگوئه",
  tunisia: "تونس",
  "ivory-coast": "ساحل عاج",
  uzbekistan: "ازبکستان",
  qatar: "قطر",
  "saudi-arabia": "عربستان",
  "south-africa": "آفریقای جنوبی",
  jordan: "اردن",
  "cape-verde": "کیپ ورد",
  ghana: "غنا",
  curacao: "کوراسائو",
  haiti: "هائیتی",
  "new-zealand": "نیوزیلند",
  "uefa-path-a": "مسیر پلی‌آف اروپا A",
  "uefa-path-b": "مسیر پلی‌آف اروپا B",
  "uefa-path-c": "مسیر پلی‌آف اروپا C",
  "uefa-path-d": "مسیر پلی‌آف اروپا D",
  "ic-path-1": "مسیر بین‌قاره‌ای ۱",
  "ic-path-2": "مسیر بین‌قاره‌ای ۲",
};

const shortName = (team: Team, lang: Language): string => {
  if (lang === "fa") {
    return TEAM_NAMES_FA[team.id] ?? team.name;
  }
  const id = team.id.toLowerCase();
  if (id === "uefa-path-a") return "UEFA Path A";
  if (id === "uefa-path-b") return "UEFA Path B";
  if (id === "uefa-path-c") return "UEFA Path C";
  if (id === "uefa-path-d") return "UEFA Path D";
  if (id === "ic-path-1") return "IC Path 1";
  if (id === "ic-path-2") return "IC Path 2";
  return team.name;
};

const PotCard = ({
  potNumber,
  teams,
  isActive,
  isRecent,
  highlightTeamId,
  compact,
  lang,
}: {
  potNumber: number;
  teams: Team[];
  isActive: boolean;
  isRecent?: boolean;
  highlightTeamId?: string;
  compact?: boolean;
  lang: Language;
}) => (
  <div
    className={`rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] text-amber-50 p-3 transition shadow ${
      isActive ? "ring-2 ring-amber-400/80" : ""
    } ${isRecent ? "animate-glow" : ""}`}
  >
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold tracking-wide text-amber-200 uppercase">
        {lang === "fa" ? `گلدان ${potNumber}` : `Pot ${potNumber}`}
      </h2>
      <span className="text-sm text-amber-100/80">
        {teams.length} {lang === "fa" ? "باقی" : "left"}
      </span>
    </div>
    <div className="space-y-2">
      {teams.length === 0 ? (
        <div className="text-sm text-amber-100/70">{lang === "fa" ? "خالی" : "Empty"}</div>
      ) : (
        teams.map((team) => (
          <TeamChip
            key={team.id}
            team={team}
            isHighlighted={isRecent && team.id === highlightTeamId}
            showSecondary={
              !compact && team.possibleConfeds !== undefined
            }
            hideText={
              compact &&
              (team.possibleConfeds !== undefined ||
                team.id.toLowerCase().startsWith("uefa-path") ||
                team.id.toLowerCase().startsWith("ic-path"))
            }
            hidePlayoffBadge={
              compact &&
              (team.possibleConfeds !== undefined ||
                team.id.toLowerCase().startsWith("uefa-path") ||
                team.id.toLowerCase().startsWith("ic-path"))
            }
            hideRanking={compact}
            lang={lang}
          />
        ))
      )}
    </div>
  </div>
);

const TeamChip = ({
  team,
  isHighlighted,
  showSecondary = false,
  hideText = false,
  hidePlayoffBadge = false,
  hideRanking = false,
  lang,
}: {
  team: Team;
  isHighlighted?: boolean;
  showSecondary?: boolean;
  hideText?: boolean;
  hidePlayoffBadge?: boolean;
  hideRanking?: boolean;
  lang: Language;
}) => {
  const rankingBadge =
    team.ranking && team.ranking >= 1 && team.ranking <= 4 && !hideRanking ? (
      <span className="badge bg-amber-100 text-amber-800 ml-2">Rank {team.ranking}</span>
    ) : null;
  const hostBadge = team.isHost ? (
    <span className="badge bg-emerald-100 text-emerald-800 ml-2">Host</span>
  ) : null;
  const playoffBadge = team.possibleConfeds && !hidePlayoffBadge ? (
    <span className="badge bg-slate-100 text-slate-700 ml-2">Playoff</span>
  ) : null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 transition bg-gradient-to-r from-[#1f2a35] to-[#1a242f] text-amber-50 ${
        isHighlighted ? "ring-2 ring-amber-400 animate-flash" : "border border-white/5"
      }`}
    >
      <div className="flex items-center gap-2">
        <FlagIcon team={team} />
        <div>
          <div className="font-medium flex items-center gap-1">
            <ConfedDot team={team} />
            {!hideText && <span>{shortName(team, lang)}</span>}
          </div>
          {showSecondary && (
            <div className="text-[11px] text-amber-100/80">
              {team.confed ?? team.possibleConfeds?.join(" / ")}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center">
        {rankingBadge}
        {hostBadge}
        {playoffBadge}
      </div>
    </div>
  );
};

const SlotRow = ({
  team,
  isRecent,
  lang,
}: {
  team?: Team;
  isRecent?: boolean;
  lang: Language;
}) => (
  <div
    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition bg-gradient-to-r from-[#1f2a35] to-[#1a242f] text-amber-50 ${
      isRecent ? "border-amber-400 shadow-lg animate-flash animate-slide-fade" : "border-white/5"
    }`}
  >
    {team ? (
      <div className="flex items-center gap-2 text-sm font-semibold w-full">
        <div className="flex items-center">
          <FlagIcon team={team} size={20} />
        </div>
        <div className="flex items-center">
          <span className="whitespace-nowrap leading-tight">{shortName(team, lang)}</span>
        </div>
      </div>
    ) : (
      <div className="text-sm text-amber-100/60 w-full">Empty</div>
    )}
  </div>
);

const GroupCard = ({
  group,
  isHighlighted,
  recentTeamId,
  compact,
  lang,
}: {
  group: Group;
  isHighlighted: boolean;
  recentTeamId?: string;
  compact?: boolean;
  lang: Language;
}) => {
  const pathway = GROUP_PATHWAY[group.id];
  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] p-3 space-y-3 text-amber-50 transition ${
        isHighlighted ? "ring-2 ring-emerald-400/80 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-wide">
          {lang === "fa" ? `گروه ${group.id}` : `Group ${group.id}`}
        </h3>
      </div>
      <div className="space-y-2">
        {group.slots
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((slot) => (
            <SlotRow
              key={slot.position}
              team={slot.team}
              isRecent={recentTeamId === slot.team?.id}
              lang={lang}
            />
          ))}
      </div>
    </div>
  );
};

const Controls = ({
  onDrawNext,
  onAuto,
  onAutoStep,
  onReset,
  drawnCount,
  isComplete,
  error,
  lang,
  t,
  onToggleLang,
}: {
  onDrawNext: () => void;
  onAuto: () => void;
  onAutoStep: () => void;
  onReset: () => void;
  drawnCount: number;
  isComplete: boolean;
  error?: string;
  lang: Language;
  t: (k: string) => string;
  onToggleLang: () => void;
}) => (
  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] backdrop-blur p-4 space-y-3 text-amber-50">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{t("controls")}</h2>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition"
          onClick={onToggleLang}
        >
          {lang === "en" ? "FA" : "EN"}
        </button>
        <span className="text-sm text-amber-100/80">
          {drawnCount} {t("teamsDrawn")}
        </span>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <button
        className="rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={onDrawNext}
        disabled={isComplete}
      >
        {t("drawNext")}
      </button>
      <button
        className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 transition"
        onClick={onReset}
      >
        {t("reset")}
      </button>
      <button
        className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition"
        onClick={onAuto}
      >
        {t("autoDraw")}
      </button>
      <button
        className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 transition"
        onClick={onAutoStep}
        disabled={isComplete}
      >
        {t("autoStep")}
      </button>
    </div>
    {isComplete && <div className="badge bg-emerald-500/30 text-white">{t("drawComplete")}</div>}
    {error && <div className="text-sm text-red-300">{error}</div>}
  </div>
);

const App = () => {
  const initial = useMemo(() => initDrawState(teams), []);
  const [state, setState] = useState<DrawState>(initial);
  const [lang, setLang] = useState<Language>("en");
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [lastDrawnTeamId, setLastDrawnTeamId] = useState<string | undefined>();
  const [lastTargetGroupId, setLastTargetGroupId] = useState<GroupId | undefined>();
  const [capturedImage, setCapturedImage] = useState<string | undefined>();
  const groupsRef = useRef<HTMLDivElement | null>(null);
  const [completeBanner, setCompleteBanner] = useState(false);
  const [spotlight, setSpotlight] = useState<{ team: Team; group: GroupId } | undefined>();
  const spotlightTimeout = useRef<number | undefined>(undefined);
  const teamLookup = useMemo<Record<string, Team>>(
    () => teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
    []
  );

  const validGroupsPreview = useMemo(() => getPreviewValidGroups(state), [state]);

  const handleDrawAnimation = (teamId?: string, groupId?: GroupId) => {
    setLastDrawnTeamId(teamId);
    setLastTargetGroupId(groupId);
    if (teamId || groupId) {
      setTimeout(() => {
        setLastDrawnTeamId(undefined);
        setLastTargetGroupId(undefined);
      }, 1200);
    }
  };

  const applyCompletion = (nextState: DrawState) => {
    setCompleteBanner(isDrawComplete(nextState));
  };
  const t = useText(lang);
  const isRTL = lang === "fa";

  const handleDrawNext = () => {
    const result = drawNextTeamSafe(state);
    if (!result) {
      // Try solving current pot or full backtracking without wiping earlier pots.
      const solved =
        reSolveCurrentPotAssignments(state) ||
        solveCurrentPot(state) ||
        solveAllPots(state);
      if (solved) {
        setState(solved);
        setInfo("Auto-resolved remaining teams to avoid a dead end.");
        setError(undefined);
        applyCompletion(solved);
        const drawn = solved.drawOrder[solved.drawOrder.length - 1];
        if (drawn) {
          const tgt = GROUP_ORDER.find((id) =>
            solved.groups[id].slots.some((s) => s.team?.id === drawn.id)
          );
          handleDrawAnimation(drawn.id, tgt);
          if (tgt) {
            setSpotlight({ team: drawn, group: tgt });
            if (spotlightTimeout.current) clearTimeout(spotlightTimeout.current);
            spotlightTimeout.current = window.setTimeout(
              () => setSpotlight(undefined),
              SPOTLIGHT_MS
            );
          }
        }
        return;
      }
      setError("Dead end reached. Please use Reset or Simulate full draw.");
      return;
    }
    const next = result.state;
    const drawnTeam = result.team;
    const targetGroup = GROUP_ORDER.find((id) =>
      next.groups[id].slots.some((s) => s.team?.id === drawnTeam.id)
    );
    handleDrawAnimation(drawnTeam.id, targetGroup);
    if (targetGroup) {
      setSpotlight({ team: drawnTeam, group: targetGroup });
      if (spotlightTimeout.current) {
        clearTimeout(spotlightTimeout.current);
      }
      spotlightTimeout.current = window.setTimeout(() => setSpotlight(undefined), SPOTLIGHT_MS);
    }
    setState(next);
    setError(undefined);
    setInfo(
      result.adjusted
        ? `Placement auto-adjusted to avoid a dead end. ${drawnTeam.name} → Group ${result.group}.`
        : undefined
    );
    applyCompletion(next);
  };

  const handleReset = () => {
    setState(initDrawState(teams));
    setError(undefined);
    setInfo(undefined);
    setCapturedImage(undefined);
    setCompleteBanner(false);
  };

  const handleAuto = () => {
    let workingState = state;
    let lastInfo: string | undefined;
    while (!isDrawComplete(workingState)) {
      const result = drawNextTeamSafe(workingState);
      if (!result) {
        const solved =
          reSolveCurrentPotAssignments(workingState) ||
          solveCurrentPot(workingState) ||
          solveAllPots(workingState);
        if (solved) {
          workingState = solved;
          lastInfo = "Auto-resolved remaining teams to avoid a dead end.";
          continue;
        }
        setError("Dead end reached during auto-draw. Reset or simulate.");
        break;
      }
      workingState = result.state;
      if (result.adjusted) {
        lastInfo = `Placement auto-adjusted to avoid a dead end. ${result.team.name} → Group ${result.group}.`;
      }
    }
    setState(workingState);
    setInfo(lastInfo);
    const drawnTeam = workingState.drawOrder[workingState.drawOrder.length - 1];
    if (drawnTeam) {
      const targetGroup = GROUP_ORDER.find((id) =>
        workingState.groups[id].slots.some((s) => s.team?.id === drawnTeam.id)
      );
      handleDrawAnimation(drawnTeam.id, targetGroup);
    }
    applyCompletion(workingState);
  };

  const handleAutoStep = async () => {
    let workingState = state;
    let lastInfo: string | undefined;
    while (!isDrawComplete(workingState)) {
      let stepHadSpotlight = false;
      const prevLength = workingState.drawOrder.length;
      const result = drawNextTeamSafe(workingState);
      if (!result) {
        const solved =
          reSolveCurrentPotAssignments(workingState) ||
          solveCurrentPot(workingState) ||
          solveAllPots(workingState);
        if (solved) {
          workingState = solved;
          lastInfo = "Auto-resolved remaining teams to avoid a dead end.";
        } else {
          setError("Dead end reached during auto step. Reset or use auto-draw.");
          break;
        }
      } else {
        workingState = result.state;
        if (result.adjusted) {
          lastInfo = `Placement auto-adjusted to avoid a dead end. ${result.team.name} → Group ${result.group}.`;
        }
      }

      // Identify the newly placed team compared to previous draw length.
      const newlyPlaced = workingState.drawOrder[prevLength];
      if (newlyPlaced) {
        const targetGroup = GROUP_ORDER.find((id) =>
          workingState.groups[id].slots.some((s) => s.team?.id === newlyPlaced.id)
        );
        handleDrawAnimation(newlyPlaced.id, targetGroup);
        if (targetGroup) {
          setSpotlight({ team: newlyPlaced, group: targetGroup });
          if (spotlightTimeout.current) clearTimeout(spotlightTimeout.current);
          spotlightTimeout.current = window.setTimeout(
            () => setSpotlight(undefined),
            SPOTLIGHT_MS
          );
          stepHadSpotlight = true;
        }
      }
      setState(workingState);
      setInfo(lastInfo);
      setError(undefined);
      applyCompletion(workingState);
      if (isDrawComplete(workingState)) break;
      const delay = stepHadSpotlight ? SPOTLIGHT_MS + 300 : 800;
      await new Promise((r) => setTimeout(r, delay));
    }
  };

  const handleCaptureImage = async (): Promise<string | undefined> => {
    const el = groupsRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: "#14100b",
      scale: 2,
      useCORS: true,
      allowTaint: false,
    });
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);
    return dataUrl;
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = "world-cup-draw.png";
    link.click();
  };

  const handleCopy = async () => {
    if (!capturedImage || !(navigator.clipboard && "write" in navigator.clipboard)) return;
    const data = await fetch(capturedImage).then((res) => res.blob());
    // @ts-ignore ClipboardItem might be missing in some browsers.
    const item = new ClipboardItem({ [data.type]: data });
    // @ts-ignore
    await navigator.clipboard.write([item]);
  };

  const handleShareX = async () => {
    const shareText = "My World Cup 2026 draw simulation #WorldCup2026";
    const dataUrl = capturedImage ?? (await handleCaptureImage());
    if (dataUrl) {
      try {
        const blob = await fetch(dataUrl).then((res) => res.blob());
        const file = new File([blob], "world-cup-draw.png", { type: blob.type });
        // @ts-ignore
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          // @ts-ignore
          await navigator.share({ files: [file], text: shareText });
          return;
        }
      } catch {
        // fall through to intent
      }
    }
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      dataUrl ? `${shareText} (attach image manually)` : shareText
    )}`;
    window.open(url, "_blank");
  };

  const groupsArray = GROUP_ORDER.map((id) => state.groups[id]);
  const lastDrawnPot = lastDrawnTeamId ? teamLookup[lastDrawnTeamId]?.pot : undefined;
  const fullPotRosters = useMemo(() => {
    const grouped: Record<number, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    teams.forEach((t) => grouped[t.pot].push(t));
    grouped[1].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
    grouped[2].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
    grouped[3].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
    grouped[4].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
    return grouped;
  }, []);

  const isTeamRemaining = (teamId: string) =>
    Object.values(state.pots).some((pot) => pot.find((t) => t.id === teamId));

  const potRows = useMemo(() => {
    const maxRows = Math.max(
      fullPotRosters[1].length,
      fullPotRosters[2].length,
      fullPotRosters[3].length,
      fullPotRosters[4].length
    );
    const rows: Array<
      [Team | undefined, Team | undefined, Team | undefined, Team | undefined]
    > = [];
    for (let i = 0; i < maxRows; i += 1) {
      rows.push([
        fullPotRosters[1][i],
        fullPotRosters[2][i],
        fullPotRosters[3][i],
        fullPotRosters[4][i],
      ]);
    }
    return rows;
  }, [fullPotRosters]);

  return (
    <div className="relative min-h-screen text-white overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-100"
        style={{
          backgroundImage: `
            url('/bg-lines.svg'),
            url('/trophy.png')
          `,
          backgroundSize: "cover, 20%",
          backgroundPosition: "center, 92% 92%",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundColor: "#0c0a07",
        }}
      />
      <header className="border-b border-amber-500/30 bg-gradient-to-r from-[#241f17] to-[#1a1510] backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 space-y-2">
          {completeBanner && (
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-300/40 px-4 py-2 text-emerald-100 shadow-sm transition-opacity animate-fade-in">
              Draw complete ✅ Download or share your result below.
            </div>
          )}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/trophy.png"
                alt="World Cup Trophy"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{t("title")}</h1>
                <p className="text-sm text-amber-100/80">
                  {t("currentPot")}: <span className="font-semibold">Pot {state.currentPot}</span>
                </p>
              </div>
            </div>
            <Controls
              onDrawNext={handleDrawNext}
              onReset={handleReset}
              onAuto={handleAuto}
              onAutoStep={handleAutoStep}
              drawnCount={state.drawOrder.length}
              isComplete={isDrawComplete(state)}
              error={error}
              lang={lang}
              t={t}
              onToggleLang={() => setLang(lang === "en" ? "fa" : "en")}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 space-y-3">
        <div
          className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] backdrop-blur p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-amber-100 uppercase tracking-wide">
              {lang === "fa" ? "گلدان‌ها" : "Pots"}
            </h2>
            <span className="text-xs sm:text-sm text-amber-200/80">
              {lang === "fa" ? "گلدان فعلی" : "Current"}: {state.currentPot}
            </span>
          </div>
          <div className="hidden md:block overflow-x-auto">
            {(() => {
              const potOrder = [1, 2, 3, 4];
              return (
                <table
                  className="w-full text-xs sm:text-sm text-amber-50 table-fixed"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <thead>
                    <tr
                      className={`${
                        isRTL ? "text-right" : "text-left"
                      } uppercase text-amber-200 text-xs tracking-wide`}
                    >
                      {potOrder.map((pot) => (
                        <th key={pot} className="py-2">
                          {lang === "fa" ? `گلدان ${pot}` : `Pot ${pot}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {potRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-white/5">
                        {potOrder.map((pot) => {
                          const team = row[pot - 1];
                          const colIdx = pot - 1;
                          if (!team) {
                            return (
                              <td key={colIdx} className={`py-2 ${isRTL ? "text-right" : ""}`}>
                                —
                              </td>
                            );
                          }
                          const remaining = isTeamRemaining(team.id);
                          const isDrawn = !remaining;
                          const isRecent = lastDrawnTeamId === team.id;
                          return (
                            <td key={team.id} className={`py-2 pr-3 ${isRTL ? "text-right" : ""}`}>
                              <div
                                className={`flex items-center gap-2 rounded-lg px-2 py-1 transition ${
                                  isRecent ? "ring-2 ring-amber-400 animate-flash" : ""
                                } ${isDrawn ? "opacity-50" : ""}`}
                                dir={isRTL ? "rtl" : "ltr"}
                              >
                                <FlagIcon team={team} size={20} />
                                <span className="font-semibold truncate max-w-[140px]">
                                  {shortName(team, lang)}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {[1, 2, 3, 4].map((pot) => (
            <PotCard
              key={pot}
              potNumber={pot}
              teams={state.pots[pot as 1 | 2 | 3 | 4]}
              isActive={state.currentPot === pot}
              isRecent={lastDrawnPot === pot}
              highlightTeamId={lastDrawnTeamId}
              compact
              lang={lang}
            />
          ))}
        </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] backdrop-blur p-4">
          <div
            className="rounded-xl border border-white/10 bg-gradient-to-b from-[#1f1c17] to-[#14100b] p-4"
            ref={groupsRef}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">{t("groupsTitle")}</h2>
              <span className="text-sm text-amber-100/80"></span>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {groupsArray.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isHighlighted={validGroupsPreview.includes(group.id)}
                recentTeamId={lastTargetGroupId === group.id ? lastDrawnTeamId : undefined}
                lang={lang}
              />
            ))}
          </div>
        </div>
        </div>

        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] backdrop-blur p-4 space-y-3">
            <h2 className="text-lg font-semibold">{t("shareExport")}</h2>
            <p className="text-sm text-amber-100/80">
              {lang === "fa"
                ? "تصویر گروه‌ها را بگیرید و ذخیره یا اشتراک‌گذاری کنید. برای X، تصویر را دستی پیوست کنید."
                : "Capture the groups grid as an image to share or download. Attach it manually when posting to X."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 transition"
                onClick={handleCaptureImage}
              >
                {t("capture")}
              </button>
              <button
                className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={!capturedImage}
              >
                {t("download")}
              </button>
              <button
                className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCopy}
                disabled={!capturedImage}
              >
                {t("copy")}
              </button>
              <button
                className="rounded-lg bg-sky-500 px-3 py-2 text-white hover:bg-sky-600 transition"
                onClick={handleShareX}
              >
                {t("shareX")}
              </button>
            </div>
            {capturedImage && (
              <div className="mt-2">
                <div className="text-sm text-amber-100/80 mb-1">
                  {lang === "fa" ? "پیش‌نمایش:" : "Preview:"}
                </div>
                <img
                  src={capturedImage}
                  alt="Captured draw"
                  className="max-h-64 w-full rounded-lg border border-white/10 object-contain"
                />
              </div>
            )}
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] backdrop-blur p-4 space-y-2">
            <h2 className="text-lg font-semibold">{t("status")}</h2>
            <p className="text-sm text-amber-100/80">
              {t("teamsDrawn")}: {state.drawOrder.length} / 48
            </p>
            <p className="text-sm text-amber-100/80">
              {t("currentPot")}: Pot {state.currentPot}
            </p>
            {isDrawComplete(state) && <div className="badge bg-emerald-500/30 text-white">{t("drawComplete")}</div>}
            {info && <div className="text-sm text-amber-200">{info}</div>}
            {error && <div className="text-sm text-red-300">{error}</div>}
          </div>
        </div>
      </main>
      {spotlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3">
          <div className="rounded-2xl border border-amber-400/50 bg-gradient-to-b from-[#2c2a24] to-[#1f1c17] px-6 sm:px-8 py-6 text-center text-amber-50 shadow-2xl animate-spotlight-pop max-w-xl sm:max-w-3xl w-full">
            <div className="text-sm uppercase tracking-wide text-amber-200 mb-2">
              {lang === "fa" ? `قرعه در گروه ${spotlight.group}` : `Drawn into Group ${spotlight.group}`}
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <FlagIcon team={spotlight.team} size={36} />
              <div className="text-3xl font-bold">{shortName(spotlight.team, lang)}</div>
            </div>
            <div className="text-xl font-extrabold text-amber-100 mb-3">
              {lang === "fa" ? `گروه ${spotlight.group}` : `Group ${spotlight.group}`}
            </div>
            <div className="space-y-2">
              {spotlight.group &&
                state.groups[spotlight.group].slots
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((slot) => (
                    <div
                      key={slot.position}
                      className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 border border-white/10"
                    >
                      {slot.team ? (
                        <>
                          <FlagIcon team={slot.team} size={22} />
                          <span className="text-base font-semibold leading-tight">
                            {shortName(slot.team, lang)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-amber-100/70">{t("empty")}</span>
                      )}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
