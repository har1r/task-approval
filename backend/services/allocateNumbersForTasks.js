const ExportCounter = require("../models/ExportCounter");
const Task = require("../models/Task");

/**
 * Assign nomor export otomatis ke task yang dipilih
 * @param {Array} tasks - Array of Task documents
 * @param {Number} year - Tahun export, misal 2025
 * @returns {Array} updates - Array info task yang diupdate
 */
async function allocateNumbersForTasks(tasks, year) {
  // Ambil atau buat counter untuk tahun ini
  let counter = await ExportCounter.findOne({ year });
  if (!counter) {
    counter = await ExportCounter.create({ year, seq: 0, titles: [] });
  }

  const updates = [];
  const titleSeqMap = {};

  // Buat map title -> seq dari counter
  counter.titles.forEach((item) => {
    titleSeqMap[item.title] = item.seq;
  });

  for (const task of tasks) {
    const title = task.title;

    // Skip jika task sudah punya exportNumber tahun ini
    if (task.exportYear === year && task.exportNumber) continue;

    let seq;

    if (titleSeqMap[title]) {
      // Title sudah ada → pakai seq yang sama
      seq = titleSeqMap[title];
    } else {
      // Title baru → naikkan seq global
      counter.seq += 1;
      seq = counter.seq;

      // Simpan di titleSeqMap & counter.titles
      titleSeqMap[title] = seq;
      counter.titles.push({ title, seq });
    }

    // Format kode export
    const exportCode = `973/${seq}-UPT.PD.WIL.IV/${year}`;

    // Update task
    task.exportNumber = seq;
    task.exportYear = year;
    task.exportCode = exportCode;
    await task.save();

    updates.push({ taskId: task._id, title, seq, exportCode });
  }

  await counter.save();
  return updates;
}

module.exports = { allocateNumbersForTasks };
