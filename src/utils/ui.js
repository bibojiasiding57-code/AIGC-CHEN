export const getSectionId = (href) => href.replace(/^#/, "");

export const getCopyFeedback = (copied, failed) => {
  if (failed) return "请手动复制邮箱";
  if (copied) return "邮箱已复制";
  return "复制邮箱";
};
