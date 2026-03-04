import fetch from 'node-fetch';

async function test() {
  try {
    const response = await fetch('https://store.steampowered.com/api/featuredcategories/');
    const data = await response.json();
    console.log(Object.keys(data));
    console.log(data.specials?.items?.length);
  } catch (e) {
    console.error(e);
  }
}
test();
