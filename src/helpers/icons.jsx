import {
  Add, ArrowBack, ArrowDropDown, Autorenew, Close, Delete,
  KeyboardArrowRight, Replay, Shuffle,
} from "@mui/icons-material";

const icons = { Add, ArrowBack, ArrowDropDown, Autorenew, Close, Delete, KeyboardArrowRight, Replay, Shuffle };

export const GetIconComponent = (name) => icons[name];
