// Row layout of the "Solution" sheet (Solution-EDV.xlsx). Each profile system is a column with
// a value cell (dropdown options where the sheet has a list) and an optional checkbox cell.
export type SolutionRow =
  | { kind: "section"; label: string }
  | { kind: "subheader"; checkLabel: string }
  | {
      kind: "field";
      key: string;
      label: string;
      options?: string[];
      multi?: boolean; // several values from options (stored comma-separated)
      extraOptions?: string[]; // second dropdown in the same cell
      check?: boolean;
      noValue?: boolean; // checkbox-only row
    };

const CAP_COLORS = [
  "Alb WS", "Maro BR", "Bronz BZ-RB", "Bronz BZ-OPL", "Antracit AGR25", "Negru SW25",
  "Silver F1-Elox", "Silver F1", "Titan F9", "Auriu F3", "Auriu F3-MG", "Cremweiss CW",
];

export const SOLUTION_ROWS: SolutionRow[] = [
  { kind: "field", key: "distance_locking", label: "Distance betw. locking points (PS / KV)", options: ["PS", "KV"] },
  { kind: "field", key: "cap_color", label: "Culoare capace", options: CAP_COLORS, multi: true },
  {
    kind: "field",
    key: "hw_axis_falt",
    label: "Ax feronerie / Falt",
    options: ["20/13", "20/9", "18/13", "18/9", "21/13"],
    extraOptions: ["Falt 16mm", "Canal EUR", "Falt lemn", "Altul"],
  },
  { kind: "field", key: "dormas_cilindru", label: "Dormas cu cilindru", options: ["25/30"] },
  { kind: "subheader", checkLabel: "Use Caps" },
  { kind: "field", key: "balama_ax", label: "Balama cu ax", check: true, options: ["SL.CS.3-6", "SL.CS.3-3", "SL.KS.3-6", "SL.KS.3-3", "SL.K.3-6 130kg", "SL.KB.3-6"] },
  { kind: "field", key: "foarfeca", label: "Foarfeca", check: true, options: ["SC with turn restrictor", "SK with turn restrictor", "SCO Without turn restrictor", "SKK Without turn restrictor"] },
  { kind: "field", key: "balama_simp_desc", label: "Balama simp. desc.", check: true, options: ["DL.C.ET", "DL.CO+DLW ERW", "DL.C + DLW ERW", "DL.K.ET", "DL.KO+DLW ERW", "DL.K + DLW ERW"] },
  { kind: "field", key: "balama_toc_jos", label: "Balama toc jos", check: true, options: ["EL.CS.6-3-10", "EL.CS.6-3-28", "EL.CS.6-3-6", "EL.CS.6-3-3", "EL.K.6-3-10", "EL.K.6-3-16", "EL.K.6-3-3", "EL.K.6-16-3", "ESV.6-3-10", "ESV.6-3-16", "ESV.6-3-3", "ESV.3-3-3"] },
  { kind: "field", key: "balama_ccv_jos", label: "Balama Ccv jos", check: true, options: ["FL.C.20-6-28", "FL.C.20-6-20", "FL.CA.20-6-28", "FL.CA.20-6-20", "FL.K.20-6-28", "FL.K.20-6-20", "FL.KA.20-6-28", "FL.KA.20-6-20", "FL.C-F", "FL.C-W", "FL.C-W.A", "FL.C-W-E1"] },
  { kind: "field", key: "blocator_std", label: "Blocator std." },
  { kind: "field", key: "blocator_siguranta", label: "Blocator siguranta" },
  { kind: "field", key: "blocator_oscilobatare", label: "Blocator oscilobatare" },
  { kind: "field", key: "blocator_ob_rc", label: "Blocator ob. RC" },
  { kind: "field", key: "blocator_tbt", label: "Blocator tilt before turn" },
  { kind: "field", key: "ridicator_cercevea", label: "Ridicator cercevea" },
  { kind: "field", key: "blocator_ob_bs", label: "Blocator ob. BS" },
  { kind: "field", key: "componente_ccv_bs", label: "Componente Ccv BS" },
  { kind: "field", key: "tip_cremon", label: "Tip cremon" },
  { kind: "field", key: "mecanism_stulp", label: "Mecanism Stulp" },
  { kind: "field", key: "dfe", label: "DFE", check: true, noValue: true },
  { kind: "field", key: "tfe", label: "TFE", check: true, noValue: true },
  { kind: "section", label: "Frame part" },
  { kind: "field", key: "msl", label: "MSL", check: true, noValue: true },
  { kind: "field", key: "zss", label: "ZSS", check: true, noValue: true },
  { kind: "field", key: "drive_rod_gak2450", label: "Drive rod GAK.2450", check: true, noValue: true },
  { kind: "field", key: "support_plate", label: "Support plate", check: true, noValue: true },
  { kind: "field", key: "blocking_plate", label: "Blocking plate", check: true, noValue: true },
  { kind: "field", key: "pull_in_device", label: "Pull-in device", check: true, noValue: true },
  { kind: "section", label: "Usi" },
  { kind: "field", key: "usi_dormas", label: "Dormas" },
  { kind: "field", key: "broasca_chei", label: "Broasca actionare chei", check: true, noValue: true },
  { kind: "field", key: "broasca_maner", label: "Broasca actionare maner", check: true, noValue: true },
  { kind: "field", key: "broasca_siguranta", label: "Broasca siguranta", check: true, noValue: true },
  { kind: "field", key: "broasca_av4", label: "Broasca AV4", check: true, noValue: true },
  { kind: "field", key: "blocator_wsk", label: "Blocator WSK" },
  { kind: "field", key: "usi_blocator_siguranta", label: "Blocator siguranta" },
  { kind: "field", key: "contraplaca_centrala", label: "Contraplaca centrala" },
  { kind: "field", key: "contraplaca_sus_jos", label: "Contraplaca sus/jos" },
  { kind: "field", key: "contraplaca_continua", label: "Contraplaca continua" },
];

export const MAX_SYSTEMS = 6;
