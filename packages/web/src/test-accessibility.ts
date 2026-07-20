export function accessibleDescriptionTexts(element: HTMLElement): string[] {
  return (element.getAttribute("aria-describedby")?.split(" ") ?? []).map((id) => {
    const description = document.getElementById(id);

    if (!description) {
      throw new Error(`Missing aria-describedby target: ${id}`);
    }

    return description.textContent ?? "";
  });
}
