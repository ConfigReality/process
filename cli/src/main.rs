use std::process::{exit, Command, Stdio};

use inquire::{InquireError, Select, Text};

fn _check_error<T>(result: Result<T, InquireError>) -> T {
    match result {
        Ok(ans) => ans,
        Err(_) => {
            println!("Errore nella scelta.");
            exit(1);
        }
    }
}

fn main() {
    println!("Hello, world!");

    let dir_img = 
        Text::new("Qul'è la direcoty delle immagini?").prompt();

    match dir_img {
        Ok(dir_img) => {
            println!("Hello, {}", dir_img);
            let detail_opts = vec![
                "preview",
                "reduced",
                "medium",
                "full",
                "raw"
            ];
            let detail = Select::new("Quale dettaglio vuoi?", detail_opts).prompt();
            let detail = _check_error(detail);

            let order_opts = vec![
                "unordered",
                "sequential"
            ];
            let orders = Select::new("Che ordinamento hanno le immagini?", order_opts).prompt();
            let orders = _check_error(orders);

            let features_opts = vec![
                "normal",
                "high"
            ];
            let features = Select::new("Che caratteristiche hanno le immagini?", features_opts).prompt();
            let features = _check_error(features);

            println!("Directory: {}", dir_img);
            
            println!("Detail: {}", detail);
            println!("Order: {}", orders);
            println!("Features: {}", features);

            // get the current directory
            let lib_dir = std::env::current_dir().unwrap();
            let lib_dir = lib_dir.to_str().unwrap();
            let lib_dir = lib_dir.split("/").collect::<Vec<&str>>();
            let lib_dir = lib_dir[..lib_dir.len()-1].join("/");
            
            let out_dir =  format!("{}/3d", lib_dir);
            let out_file = format!("{}/{}", out_dir, "output.usdz");
            let lib_dir = format!("{}/src/lib", lib_dir);
            let lib_exec = format!("{}/HelloPhotogrammetry", lib_dir);

            println!("Lib dir: {}", lib_dir);
            println!("Lib exec: {}", lib_exec);
            println!("Out dir: {}", out_dir);
            println!("Out file: {}", out_file);
            println!();
            println!("{} {} {} -d {} -o {} -f {}",lib_exec, dir_img, out_file, detail, orders, features);

            let mut cmd = Command::new(lib_exec)
                .arg(dir_img)
                .arg(out_file)
                .arg("-d")
                .arg(detail)
                .arg("-o")
                .arg(orders)
                .arg("-f")
                .arg(features)
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .spawn()
                .unwrap();

                let status = cmd.try_wait();
                println!("Exited with status {:?}", status);
        },
        Err(_) => {
            println!("An error happened when asking for your name, try again later.");
            exit(1);
        },
    }
}
