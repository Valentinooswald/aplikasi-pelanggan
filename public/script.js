function tambahData() {
  fetch('/tambah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idpel: document.getElementById('idpel').value,
      nama: document.getElementById('nama').value,
      tarif: document.getElementById('tarif').value,
      daya: document.getElementById('daya').value,
      no_bindex: document.getElementById('no_bindex').value,
      area: document.getElementById('area').value
    })
  })
  .then(res => res.text())
  .then(msg => {
    alert(msg);
    loadData();

    // kosongkan form
    document.getElementById('idpel').value = "";
    document.getElementById('nama').value = "";
    document.getElementById('tarif').value = "";
    document.getElementById('daya').value = "";
    document.getElementById('no_bindex').value = "";
    document.getElementById('area').value = "";
  })
  .catch(err => {
    console.log("ERROR:", err);
  });
}
