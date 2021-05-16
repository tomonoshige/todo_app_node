const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '3290mtyosmqol@!',
  database: 'todo_app'
});

connection.connect((err) => {
      if (err) {
        console.log('error connecting: ' + err.stack);
        return;
      }
      console.log('success');
});
// ここまで設定

// ここからコード

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/index', (req, res) => {
    connection.query(
      'SELECT * FROM todo_list',
      (error, results) => {
        res.render('index.ejs', {todo_list: results});
        }
    );
});

//TODO追加機能
app.get('/new', (req, res) => {
      res.render('new.ejs');
});

app.post('/create', (req, res) => {
  connection.query(
    'INSERT INTO todo_list(work) VALUES(?)',
    [req.body.todoName],
      (error, results) => {
        res.redirect('/index');
        }
  );
});

//完了ボタンでTODO削除
app.post('/delete/:id', (req, res) => {
    connection.query(
        'DELETE FROM todo_list WHERE id = ?',
        [req.params.id],
          (error, results) => {
            res.redirect('/index');
            }
    );
});

//編集ボタンででTODO編集
app.get('/edit/:id', (req, res) => {
    connection.query(
        'SELECT * FROM todo_list WHERE id = ?',
        [req.params.id],
          (error, results) => {
            res.render('edit.ejs', {todo_list: results[0]});
            }
    );
});

app.post('/update/:id', (req, res) => {
    connection.query(
      'UPDATE todo_list SET work = ? WHERE id = ?',
      [req.body.todoName, req.params.id],
        (error, results) => {
          res.redirect('/index');
          }
    );
  });



// サーバを起動
app.listen(3000);