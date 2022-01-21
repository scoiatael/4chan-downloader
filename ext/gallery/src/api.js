import oboe from "oboe";
import { List } from "immutable";

function server() {
  return process.env.NODE_ENV === "production" ? "" : "http://localhost:9393";
}

export async function getFolders() {
  const response = await fetch(server() + "/api/folders");
  const all = await response.json();
  return all;
}

export async function mergeFolders(folder_id, target) {
  const response = await fetch(server() + "/folder/" + folder_id + "/merge", {
    method: "POST",
    body: JSON.stringify({ target: target }),
  });
  if (response.status !== 200) {
    throw new Error(`HTTP returned: ${response.status}`);
  }
}

export async function deleteFolder(folder_id) {
  const response = await fetch(server() + "/folder/" + folder_id, {
    method: "DELETE",
  });
  if (response.status !== 200) {
    throw new Error(`HTTP returned: ${response.status}`);
  }
}

export async function bundleFolder(folder_id) {
  window.location = server() + "/bundle/" + folder_id;
}

export async function getPhotos(folder_id, page) {
  const response = await fetch(
    server() + "/api/folder/" + folder_id + "/images?page=" + page
  );
  if (response.status !== 200) {
    console.error(response);
    throw new Error(`HTTP returned: ${response.status}`);
  }
  const all = await response.json();
  return all;
}

export async function getAllPhotos(folder_id) {
  let next = 0;
  let all = List.of();
  while (next !== null) {
    const { records, page } = await getPhotos(folder_id, next);
    all = all.push(...records);
    next = page.next;
  }
  return all;
}

export async function deletePhoto(img) {
  const response = await fetch(img.src, { method: "DELETE" });
  return response;
}

export async function likePhoto(img) {
  const response = await fetch(img.src, { method: "PUT" });
  return response;
}

export async function download(url) {
  const body = JSON.stringify({
    url: url,
  });
  const headers = [
    ["Content-Type", "application/json"],
    ["Accept", "application/json,text/*;q=0.1"],
  ];
  const response = await fetch(server() + "/api/download", {
    method: "POST",
    body,
    headers,
  });
  return response;
}

export function downloadStatus(jobId) {
  return oboe({
    url: server() + `/api/job/${jobId}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
