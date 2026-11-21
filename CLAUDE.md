# Instrukcja dla Claude'a

Przeczytaj przed każdą zmianą. Projekt hackathonowy, który cały czas się zmienia – **o kształcie aplikacji
decyduje aktualny kod i człowiek, z którym pracujesz**, nie ten plik. Ten plik dotyczy tylko tego,
jak bezpiecznie wprowadzać zmiany.

## Najważniejsza zasada

**`main` musi zawsze działać.** Nigdy nie commituj ani nie pushuj na `main`.
Pracuj na własnej gałęzi → Pull Request → merge robi człowiek.

## Zanim powiesz, że zadanie jest gotowe

Sprawdź to sam, **za każdym razem przed commitem** – nie zakładaj, że działa:

1. Sprawdzenie typów – bez błędów.
2. Testy – wszystkie przechodzą. Zmieniasz zachowanie gry → dopisz lub popraw test.
3. Build wersji web – przechodzi.
4. Zmiana widoczna dla gracza → uruchom aplikację w przeglądarce i sprawdź ją, bez błędów w konsoli.
5. Napisz człowiekowi wprost, czego **nie** sprawdziłeś.

Komendy sprawdź w `package.json` (sekcja `scripts`). Na Windows w PowerShellu skrypty `npm` bywają
zablokowane – używaj wtedy `npm.cmd` / `npx.cmd`. Po `git pull` uruchom `npm install`, jeśli zmienił się
`package.json`.

## Git

1. Zacznij od aktualnego `main`: `git switch main` → `git pull origin main` → `git switch -c <nazwa-zadania>`.
2. Małe commity z jasnym opisem.
3. Gotowe i sprawdzone → push gałęzi → Pull Request do `main` z opisem: co zmieniono, jak sprawdzono,
   czego nie sprawdzono.
4. GitHub Actions uruchamia testy i build dla każdego PR-a. Czerwony check = nie mergujemy.
5. **Merge robi człowiek.** Nie mergeuj sam, nie używaj `--force`, nie przepisuj historii `main`.
6. Konflikt: nie nadpisuj cudzych zmian – połącz obie wersje i pokaż człowiekowi wynik.
7. Nie commituj `node_modules/`, `dist/`, plików `.env`, kluczy ani haseł.

## Ostrożnie

- Zmiany w plikach używanych przez cały zespół (zależności w `package.json`, konfiguracja, wspólne typy,
  stan gry) uzgodnij z człowiekiem przed wprowadzeniem.
- Gra zapisuje postęp w przeglądarce – zmiana struktury zapisanego stanu nie może psuć starych zapisów.
