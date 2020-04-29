const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const PageV = require("./models/pageView");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const logger = (req, res, next) => {
  console.log("Nueva petición HTTP", req._parsedUrl.pathname);

  const vpage = new PageV({path: req._parsedUrl.pathname, userAgent: req.headers['user-agent'], date: Date.now() });

  vpage.save(function(err){
    if(err) return res.send("Error guardando los datos: " + err);
  });
  next(); // esto es necesario para que la petición continúe
}

app.get("/", logger, async (req, res) => {
  const notes = await Note.find();
  res.render("index",{ notes: notes } )
});

app.get("/notes/new", logger, async (req, res) => {
  const notes = await Note.find();
  res.render("new", { notes: notes });
});

app.post("/notes", async (req, res, next) => {
  const data = {
    title: req.body.title,
    body: req.body.body
  };

  const note = new Note(req.body);
  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.redirect('/');
});

app.get("/notes/:id", logger, async (req, res) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", logger, async (req, res, next) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("edit", { notes: notes, currentNote: note });
});

app.patch("/notes/:id", async (req, res) => {
  const id = req.params.id;
  const note = await Note.findById(id);

  note.title = req.body.title;
  note.body = req.body.body;

  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.status(204).send({});
});

app.delete("/notes/:id", async (req, res) => {
  await Note.deleteOne({ _id: req.params.id });
  res.status(204).send({});
});

app.get("/analytic", logger,  (req, res)=>{

    PageV.aggregate().group({
      _id: "$path",
      count: {
        $sum: 1,
      },
    }).sort("-count").exec((err, data)=>  res.render("tabla",{data}) );
});

app.listen(3000, () => console.log("Listening on port 3000 ..."));
