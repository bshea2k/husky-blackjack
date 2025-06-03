
window.addEventListener("DOMContentLoaded", initLeaderboard);

async function initLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  const db = firebase.firestore();

  try {
    // Get up to 10 users, sorted by chips descending
    const snapshot = await db
      .collection("users")
      .orderBy("chips", "desc")
      .limit(10)
      .get();

    // If no users exist, show message
    if (snapshot.empty) {
      tbody.innerHTML = "<tr><td colspan='3'>No users found</td></tr>";
      return;
    }

    // Otherwise, build table rows
    let rank = 1;
    let rowsHtml = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const name = data.name || "Unknown";
      const chips = data.chips != null ? data.chips : 0;

      rowsHtml += `
        <tr>
          <td>${rank}</td>
          <td>${name}</td>
          <td>${chips}</td>
        </tr>
      `;
      rank++;
    });

    tbody.innerHTML = rowsHtml;
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    tbody.innerHTML = "<tr><td colspan='3'>Error loading data</td></tr>";
  }
}
