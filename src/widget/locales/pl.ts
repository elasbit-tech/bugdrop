import type { WidgetStrings } from '../i18n';

// Polish "few" plural form: 2-4, 22-24, 32-34, ... (but not 12-14).
function isFew(count: number): boolean {
  const mod10 = count % 10;
  const mod100 = count % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14);
}

export const pl: WidgetStrings = {
  // Trigger button & pull tab
  triggerLabel: 'Opinia',
  triggerAriaLabel: 'Zgłoś błąd lub wyślij opinię',
  dismissButtonAriaLabel: 'Ukryj przycisk opinii',
  pullTabAriaLabel: 'Pokaż przycisk opinii',
  dragHandleTitle: 'Przeciągnij przycisk opinii',
  // Install prompt
  installRequiredTitle: 'Wymagana instalacja',
  connectionErrorTitle: 'Błąd połączenia',
  installRequiredMessage: 'BugDrop wymaga instalacji aplikacji GitHub, aby tworzyć zgłoszenia.',
  apiUnreachableMessage:
    'Nie można połączyć się z API BugDrop. Sprawdź połączenie sieciowe lub adres URL w tagu skryptu.',
  installApp: 'Zainstaluj aplikację',
  // Welcome screen
  welcomeTitle: 'Podziel się opinią',
  welcomeHeadline: 'Pomóż nam się rozwijać, dzieląc się swoimi uwagami',
  welcomeBodyLine1: 'Zgłaszaj błędy, proponuj funkcje lub zostaw opinię.',
  welcomeBodyLine2: 'Opcjonalnie możesz dołączyć zrzuty ekranu z adnotacjami.',
  getStarted: 'Rozpocznij',
  // Feedback form
  feedbackFormTitle: 'Wyślij opinię',
  categoryLabel: 'Kategoria',
  categoryBug: 'Błąd',
  categoryFeature: 'Propozycja',
  categoryQuestion: 'Pytanie',
  nameLabel: 'Imię i nazwisko',
  namePlaceholder: 'Twoje imię i nazwisko',
  emailLabel: 'E-mail',
  emailPlaceholder: 'twoj@email.com',
  titleLabel: 'Tytuł',
  titlePlaceholder: 'Krótki opis problemu lub sugestii',
  descriptionLabel: 'Opis',
  descriptionPlaceholder: 'Podaj dodatkowe szczegóły, kroki do odtworzenia lub kontekst...',
  screenshotAutoNote:
    'Ta strona automatycznie dołączy zrzut całej strony podczas wysyłania, bez pokazywania podglądu. Przed wysłaniem sprawdź, czy strona nie zawiera poufnych informacji.',
  screenshotRequiredNote: '📸 Zrzut ekranu jest wymagany przed wysłaniem.',
  includeScreenshotLabel: '📸 Dołącz zrzut ekranu',
  sendConsoleLogsLabel: 'Wyślij logi konsoli',
  // Uploads
  uploadsAriaLabel: 'Załączniki',
  uploadFilesAriaLabel: 'Prześlij pliki',
  uploadButton: 'Prześlij',
  uploadTooMany: (max: number) =>
    `Można przesłać maksymalnie ${max} ${isFew(max) ? 'pliki' : 'plików'}. Usuń plik, aby dodać kolejny.`,
  uploadUnsupportedType:
    'Ten typ pliku nie jest obsługiwany. Prześlij obraz, plik PDF lub krótki film.',
  uploadTooLarge: (maxSize: string) =>
    `Plik jest za duży. Prześlij pliki o rozmiarze do ${maxSize}.`,
  uploadReadError: 'Nie udało się odczytać pliku. Spróbuj z innym.',
  removeAttachmentAriaLabel: (name: string) => `Usuń ${name}`,
  // Common buttons
  cancel: 'Anuluj',
  continueButton: 'Dalej',
  submit: 'Wyślij',
  // Submission
  submittingTitle: 'Wysyłanie...',
  creatingIssue: 'Tworzenie zgłoszenia...',
  rateLimited: (minutes: number) =>
    `Zbyt wiele zgłoszeń. Spróbuj ponownie za ${minutes} ${
      minutes === 1 ? 'minutę' : isFew(minutes) ? 'minuty' : 'minut'
    }.`,
  submitFailedFallback: 'Nie udało się wysłać',
  networkError: 'Błąd sieci. Sprawdź połączenie z internetem.',
  submissionFailedTitle: 'Wysyłanie nie powiodło się',
  tryAgain: 'Spróbuj ponownie',
  // Success modal
  successTitle: 'Opinia wysłana!',
  issueCreated: (issueNumberHtml: string) => `Utworzono zgłoszenie ${issueNumberHtml}.`,
  feedbackSubmittedMessage: 'Twoja opinia została pomyślnie wysłana.',
  viewOnGitHub: 'Zobacz na GitHubie',
  done: 'Gotowe',
  // Screenshot options
  captureScreenshotTitle: 'Zrób zrzut ekranu',
  chooseWhatToCapture: 'Wybierz, co przechwycić:',
  pageTooComplexViewportNote:
    'Ta strona jest zbyt złożona, aby przechwycić całą stronę lub zaznaczony obszar. Przechwyć widoczny obszar albo zaznacz konkretny element.',
  pageTooComplexElementNote:
    'Ta strona jest zbyt złożona, aby przechwycić całą stronę lub zaznaczony obszar. Zamiast tego zaznacz konkretny element.',
  fullPage: 'Cała strona',
  captureViewport: 'Przechwyć widoczny obszar',
  selectArea: 'Zaznacz obszar',
  selectElement: 'Zaznacz element',
  skipScreenshot: 'Pomiń zrzut ekranu',
  // Element & area pickers
  areaPickerInstruction: 'Narysuj zaznaczenie wokół obszaru do przechwycenia',
  elementPickerInstruction: 'Kliknij dowolny element, aby go przechwycić',
  elementPickerTouchInstruction: 'Dotknij dowolny element, aby go przechwycić',
  escToCancel: 'ESC, aby anulować',
  // Capture loading & failures
  capturingTitle: 'Przechwytywanie...',
  capturingScreenshot: 'Trwa przechwytywanie zrzutu ekranu...',
  captureFailedTitle: 'Przechwytywanie nie powiodło się',
  captureFailedMessage:
    'Nie udało się przechwycić zrzutu ekranu. Strona może być zbyt złożona lub przeglądarka na to nie pozwala.',
  chooseAnotherMethod: 'Wybierz inną metodę',
  // Annotation step
  reviewScreenshotTitle: 'Sprawdź zrzut ekranu',
  annotationInstruction:
    'Przed wysłaniem sprawdź, czy nie widać poufnych informacji. Zakryj poufne obszary przed przesłaniem. Zamazania są trwale zapisywane w przesyłanym obrazie.',
  selectedElementNote: (linkHtml: string) =>
    `Potrzebujesz więcej otaczającego kontekstu? Dostosuj ${linkHtml} w tagu skryptu BugDrop.`,
  toolDraw: 'Rysuj',
  toolArrow: 'Strzałka',
  toolRectangle: 'Prostokąt',
  toolRedact: 'Zamaż',
  undo: 'Cofnij',
  retake: 'Ponów zrzut',
  submitFeedback: 'Wyślij opinię',
  // Capture timeout
  captureTimeout:
    'Upłynął limit czasu przechwytywania zrzutu ekranu — strona może być zbyt złożona',
};
