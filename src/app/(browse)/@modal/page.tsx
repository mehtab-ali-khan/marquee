// The @modal slot for "/" itself: empty. Without this, navigating from an open
// modal back to "/" (e.g. clicking the logo) would keep the old modal on screen,
// because slots keep their last content during client-side navigation.
export default function NoModalOnHome() {
  return null;
}
