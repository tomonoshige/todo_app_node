const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');

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

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
)

// ここまで設定

// ここからコード

app.use((req, res, next) => {
  if(req.session.userId === undefined) {
    res.locals.username = 'ゲスト';
    res.locals.isLoggedIn = false;
    console.log('ログインしてません');
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
    console.log('ログイン中');
  }
  next();
});

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

//How To MYTODOボタンでHow To表示
app.get('/howto', (req, res) => {
  connection.query(
    'SELECT * FROM howto_todo',
    (error, results) => {
      res.render('howto.ejs', {howto_todo: results});
      }
  );
});

//ログイン機能
app.get('/login', (req, res) => {
  connection.query(
    'SELECT * FROM users',
    (error, results) => {
      res.render('login.ejs', {errors: [], users: results});
      }
  );
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const errors = [];
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if(results.length > 0) {
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain, hash, (error, isEqual) => {
          if(isEqual) {
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            console.log('認証に成功');
            res.redirect('/index');
          } else {
            errors.push('パスワードが違います');
            connection.query(
              'SELECT * FROM users',
              (error, results) => {
                res.render('login.ejs', {errors: errors, users: results});
                }
            );
          }
        });
      } else {
        errors.push('登録されていないメールアドレスです');
        connection.query(
          'SELECT * FROM users',
          (error, results) => {
            res.render('login.ejs', {errors: errors, users: results});
            }
        );
      }
    }
  );
});

//ログアウト機能
app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/index');
  });
});

//ユーザー登録機能
app.get('/signup', (req,res) => {
  res.render('signup.ejs', {errors: []});
});

app.post('/signup',
  //ユーザー登録必要事項入力時の空チェック機能
  (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
      if(username === '') {
        errors.push('ユーザー名が空です');
      }
      if(email === '') {
        errors.push('メールアドレスが空です');
      }
      if(password === '') {
        errors.push('パスワードが空です');
      }
      if(errors.length >0) {
        res.render('signup.ejs', {errors: errors});
      } else {
        next();
      }
  },
  //メールアドレス重複チェック機能
  (req, res, next) => {
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) =>{
        if(results.length > 0) {
          errors.push('メールアドレスが重複してます');
          res.render('signup.ejs', {errors: errors});
        } else {
          next();
        }
      }
    );
  },
  //ユーザー登録機能（パスワードのハッシュ化）
  (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hash],
        (error, results) => {
          req.session.userId = results.insertId;
          req.session.username = username;
          res.redirect('/index');
        }
      );
    });
});

// サーバを起動
app.listen(3000);
