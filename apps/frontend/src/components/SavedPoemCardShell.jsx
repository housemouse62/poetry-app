function SavedPoemCardShell({
  cardClassName,
  cardDataAttributes,
  title,
  isFavorited,
  favoritePending,
  favoriteButtonRef,
  onFavorite,
  actionsClassName,
  actions,
  error,
  children,
}) {
  return (
    <article className={cardClassName} {...cardDataAttributes}>
      <div className="card-top">
        <div className="card-top-left">{children}</div>
        <div className="card-top-right">
          <button
            ref={favoriteButtonRef}
            className="favorite-button"
            type="button"
            aria-pressed={isFavorited}
            aria-label={
              isFavorited
                ? `Remove ${title} from favorites`
                : `Add ${title} to favorites`
            }
            disabled={favoritePending}
            onClick={onFavorite}
          >
            {isFavorited ? "⭐" : "☆"}
          </button>
        </div>
      </div>
      <div className={actionsClassName}>{actions}</div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

export default SavedPoemCardShell;
