export type VideoFormat = {
  format_id: string;
  ext: string;
  resolution: string;
  format_note?: string;
  vcodec: string;
  filesize: string;
  filesize_approx: string;
};

export type FormatsByExt = {
  video: Record<
    string,
    { format_id: string; resolution: string; filesize: string }[]
  >;
  audio: { format_id: string; ext: string, filesize: string }[];
};

export type ReplyPayload = {
  message: string;
  id: string;
  title: string;
  thumbnail: string;
  formats: FormatsByExt;
};
