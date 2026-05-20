export function generateSlug(title: string): string {
  return title
    .toLowerCase() // convert to lowercase
    .trim() // remove extra spaces
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/-+/g, "-"); // remove multiple -
}